"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Full-page ink canvas: a ping-pong feedback simulation where the cursor
 * lays down ember ink that curls, drifts, and dissipates - over a barely-lit
 * painted nebula. Fixed behind all content; pauses when the tab is hidden.
 */

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const NOISE = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.03;
      a *= 0.5;
    }
    return v;
  }
`;

// Feedback pass: advect the previous frame along a gentle curl field,
// dissipate, and splat fresh ink along the cursor's path segment.
const SIM_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPrev;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform float uForce;
  uniform float uAspect;
  uniform float uTime;
  ${NOISE}

  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    // Curl-ish drift so the ink smears like wet paint instead of decaying in place.
    vec2 q = vUv * 3.0;
    vec2 flow = vec2(
      noise(q + uTime * 0.06) - 0.5,
      noise(q + 17.7 - uTime * 0.05) - 0.5
    ) * 0.0035;
    flow.y += 0.0006;

    float ink = texture2D(uPrev, vUv - flow).r * 0.962;

    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    vec2 a = vec2(uPrevMouse.x * uAspect, uPrevMouse.y);
    vec2 b = vec2(uMouse.x * uAspect, uMouse.y);
    float d = sdSegment(p, a, b);
    float radius = 0.018 + uForce * 0.05;
    ink += smoothstep(radius, 0.0, d) * uForce * 0.9;

    gl_FragColor = vec4(clamp(ink, 0.0, 1.5), 0.0, 0.0, 1.0);
  }
`;

// Display pass: near-black canvas, faint painted nebula, ember ink ramp.
const DRAW_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uInk;
  uniform float uTime;
  uniform float uAspect;
  ${NOISE}

  void main() {
    float ink = texture2D(uInk, vUv).r;

    // Ink smears the underlying paint slightly.
    vec2 p = vec2(vUv.x * uAspect, vUv.y) * 2.4;
    p += ink * 0.28;
    float n = fbm(p + fbm(p + uTime * 0.015));

    vec3 base = vec3(0.014, 0.013, 0.015);
    vec3 petrol = vec3(0.035, 0.070, 0.085);
    vec3 umber = vec3(0.11, 0.075, 0.05);

    vec3 col = base;
    col = mix(col, petrol, smoothstep(0.35, 0.75, n) * 0.10);
    col = mix(col, umber, smoothstep(0.55, 0.95, n) * 0.14);

    // Ember ink ramp: deep red core, molten mid, cream-hot peak.
    float t = clamp(ink, 0.0, 1.0);
    vec3 inkCol = mix(vec3(0.30, 0.05, 0.01), vec3(1.0, 0.45, 0.10), smoothstep(0.05, 0.6, t));
    inkCol = mix(inkCol, vec3(1.0, 0.85, 0.58), smoothstep(0.75, 1.1, ink));
    col += inkCol * (t * 0.85 + t * t * 0.5);

    // Vignette, darker toward the top so the nav always reads.
    float vig = smoothstep(1.45, 0.4, distance(vUv, vec2(0.5, 0.42)));
    col *= mix(0.5, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const SIM_SCALE = 0.5;

export const PaintBackground = () => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    host.appendChild(renderer.domElement);

    const makeTarget = () =>
      new THREE.WebGLRenderTarget(
        Math.max(1, Math.floor(window.innerWidth * SIM_SCALE)),
        Math.max(1, Math.floor(window.innerHeight * SIM_SCALE)),
        {
          depthBuffer: false,
          magFilter: THREE.LinearFilter,
          minFilter: THREE.LinearFilter,
          type: THREE.HalfFloatType,
        }
      );

    let read = makeTarget();
    let write = makeTarget();

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();

    const simUniforms = {
      uAspect: { value: window.innerWidth / window.innerHeight },
      uForce: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uPrev: { value: read.texture },
      uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
    };
    const drawUniforms = {
      uAspect: { value: window.innerWidth / window.innerHeight },
      uInk: { value: read.texture },
      uTime: { value: 0 },
    };

    const simMaterial = new THREE.ShaderMaterial({
      fragmentShader: SIM_FRAGMENT,
      uniforms: simUniforms,
      vertexShader: VERTEX,
    });
    const drawMaterial = new THREE.ShaderMaterial({
      fragmentShader: DRAW_FRAGMENT,
      uniforms: drawUniforms,
      vertexShader: VERTEX,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
    scene.add(quad);

    const timer = new THREE.Timer();
    const mouse = new THREE.Vector2(0.5, 0.5);
    const target = new THREE.Vector2(0.5, 0.5);
    let force = 0;
    let rafId = 0;

    const render = () => {
      timer.update();
      const elapsed = timer.getElapsed();

      const prev = mouse.clone();
      mouse.lerp(target, 0.35);

      simUniforms.uTime.value = elapsed;
      simUniforms.uPrev.value = read.texture;
      simUniforms.uPrevMouse.value.copy(prev);
      simUniforms.uMouse.value.copy(mouse);
      simUniforms.uForce.value = force;
      force *= 0.9;

      quad.material = simMaterial;
      renderer.setRenderTarget(write);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);

      const swap = read;
      read = write;
      write = swap;

      drawUniforms.uTime.value = elapsed;
      drawUniforms.uInk.value = read.texture;
      quad.material = drawMaterial;
      renderer.render(scene, camera);
    };

    const loop = () => {
      render();
      rafId = requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      const nx = event.clientX / window.innerWidth;
      const ny = 1 - event.clientY / window.innerHeight;
      force = Math.min(1.2, force + Math.hypot(nx - target.x, ny - target.y) * 6);
      target.set(nx, ny);
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      simUniforms.uAspect.value = window.innerWidth / window.innerHeight;
      drawUniforms.uAspect.value = simUniforms.uAspect.value;
      read.dispose();
      write.dispose();
      read = makeTarget();
      write = makeTarget();
      if (reduceMotion) {
        render();
      }
    };

    const onVisibility = () => {
      if (reduceMotion) {
        return;
      }
      cancelAnimationFrame(rafId);
      if (!document.hidden) {
        rafId = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) {
      render();
    } else {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      quad.geometry.dispose();
      simMaterial.dispose();
      drawMaterial.dispose();
      read.dispose();
      write.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      ref={hostRef}
    />
  );
};
