"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Liquid-metal sculpture: a chrome sphere displaced by simplex noise, lit by
 * an ember key light against a cool rim, with normals rebuilt in the vertex
 * shader so reflections stay smooth while the surface flows.
 */

const SIMPLEX = /* glsl */ `
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  vec3 displace(vec3 unit, float time, float amp) {
    float n = snoise(unit * 1.5 + vec3(0.0, time * 0.22, time * 0.1));
    n += 0.35 * snoise(unit * 3.4 - time * 0.15);
    return unit * (1.0 + n * amp);
  }
`;

export const Sculpture = ({ className }: { className?: string }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      host.clientWidth / host.clientHeight,
      0.1,
      30
    );
    camera.position.set(0, 0, 4.4);

    // Procedural studio reflections; no external HDR asset needed.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const key = new THREE.PointLight(0xff7a1a, 30);
    key.position.set(-3, 2, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x93c5fd, 2.2);
    rim.position.set(4, -1, -3);
    scene.add(rim);

    const timeUniform = { value: 0 };
    const ampUniform = { value: 0.16 };

    const material = new THREE.MeshPhysicalMaterial({
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
      color: 0x16151a,
      envMap,
      envMapIntensity: 1.1,
      metalness: 1,
      roughness: 0.22,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uAmp = ampUniform;
      shader.uniforms.uTime = timeUniform;
      shader.vertexShader = `
        uniform float uTime;
        uniform float uAmp;
        ${SIMPLEX}
        ${shader.vertexShader}
      `
        .replace(
          "#include <beginnormal_vertex>",
          /* glsl */ `
          vec3 unit = normalize(position);
          vec3 tangentA = normalize(cross(unit, abs(unit.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
          vec3 tangentB = normalize(cross(unit, tangentA));
          float eps = 0.015;
          vec3 displaced = displace(unit, uTime, uAmp);
          vec3 neighborA = displace(normalize(unit + tangentA * eps), uTime, uAmp);
          vec3 neighborB = displace(normalize(unit + tangentB * eps), uTime, uAmp);
          vec3 objectNormal = normalize(cross(neighborA - displaced, neighborB - displaced));
          `
        )
        .replace(
          "#include <begin_vertex>",
          "vec3 transformed = displaced;"
        );
    };

    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 48), material);
    scene.add(mesh);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const timer = new THREE.Timer();
    let rafId = 0;

    const render = () => {
      renderer.render(scene, camera);
    };

    const loop = () => {
      timer.update();
      timeUniform.value = timer.getElapsed();
      // The cursor stirs the metal: more churn while moving across the page.
      const stir = 0.16 + Math.min(0.08, Math.abs(pointer.x) * 0.05);
      ampUniform.value += (stir - ampUniform.value) * 0.04;
      mesh.rotation.y += 0.0016 + (pointer.x * 0.4 - mesh.rotation.y) * 0.012;
      mesh.rotation.x += (pointer.y * 0.25 - mesh.rotation.x) * 0.012;
      render();
      rafId = requestAnimationFrame(loop);
    };

    const resizeObserver = new ResizeObserver(() => {
      const { clientHeight, clientWidth } = host;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      if (reduceMotion) {
        render();
      }
    });
    resizeObserver.observe(host);

    if (reduceMotion) {
      timeUniform.value = 4;
      render();
    } else {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      mesh.geometry.dispose();
      material.dispose();
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div aria-hidden className={className} ref={hostRef} />;
};
