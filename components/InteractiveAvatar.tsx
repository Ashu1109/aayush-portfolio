'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const source = '/images/developer-avatar.webp';
const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// Landmark coordinates refer to the original 1254 × 1254 illustration.
// Inverse mapping moves the head as one piece and eases into a fixed torso.
const fragmentSource = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uPortrait;
uniform sampler2D uBlinkPortrait;
uniform sampler2D uHappyPortrait;
uniform vec2 uGaze;
uniform float uBlink;
uniform float uHappy;
uniform float uCurious;
uniform float uBreath;
uniform float uNod;
float ellipse(vec2 p, vec2 center, vec2 radius, float feather) {
  return 1.0 - smoothstep(1.0 - feather, 1.0, length((p - center) / radius));
}
vec4 portrait(sampler2D image, vec2 p) {
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0);
  return texture2D(image, vec2(p.x, 1.0 - p.y));
}
void main() {
  vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * 1.08 + 0.5;
  float head = 1.0 - smoothstep(0.363, 0.455, p.y);
  vec2 pivot = vec2(0.501, 0.415);
  float roll = uGaze.x * 0.033 + uCurious * 0.012;
  vec2 offset = p - pivot;
  float c = cos(roll), s = sin(roll);
  vec2 turned = mat2(c, -s, s, c) * offset + pivot;
  turned.x -= uGaze.x * 0.010;
  turned.y -= uGaze.y * 0.006 + uNod;
  p = mix(p, turned, head);
  p.y -= uBreath * (1.0 - smoothstep(0.7, 1.0, p.y));

  vec2 leftEye = vec2(0.426, 0.217);
  vec2 rightEye = vec2(0.521, 0.195);
  float eyes = max(ellipse(p, leftEye, vec2(0.032,0.021),0.68), ellipse(p, rightEye, vec2(0.032,0.021),0.68));
  float eyebrows = max(ellipse(p, vec2(0.417,0.174),vec2(0.049,0.025),0.8), ellipse(p,vec2(0.511,0.153),vec2(0.05,0.025),0.8));
  vec2 faceUv = p;
  faceUv -= uGaze * vec2(0.0055,0.0035) * eyes * (1.0-uBlink) * (1.0-uHappy*0.6);
  faceUv.y += uCurious * eyebrows * 0.003;
  vec4 color = portrait(uPortrait, faceUv);

  float smileMask = ellipse(p, vec2(0.493,0.290),vec2(0.130,0.135),0.30);
  // Only facial RGB is blended. Expression backgrounds never enter the alpha silhouette.
  color.rgb = mix(color.rgb, portrait(uHappyPortrait, p).rgb, uHappy * smileMask);
  float lids = max(ellipse(p,leftEye,vec2(0.050,0.035),0.42),ellipse(p,rightEye,vec2(0.050,0.035),0.42));
  color.rgb = mix(color.rgb, portrait(uBlinkPortrait, p).rgb, uBlink * lids);
  gl_FragColor = vec4(color.rgb * color.a, color.a);
}`;

type Controller = { refresh: () => void; greet: () => void; curious: (value: boolean) => void };

export default function InteractiveAvatar({ paused }: { paused: boolean }) {
  const host = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<Controller | null>(null);
  const pausedRef = useRef(paused);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [greeting, setGreeting] = useState(false);

  useEffect(() => { pausedRef.current = paused; controller.current?.refresh(); }, [paused]);
  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);

  useEffect(() => {
    const node = host.current;
    const surface = canvas.current;
    if (!node || !surface) return;
    let disposed = false;
    let frame = 0;
    let visible = true;
    let hasBlink = false;
    let hasHappy = false;
    let baseReady = false;
    let contextLost = false;
    let previousTime = 0;
    let nextBlink = performance.now() + 3000;
    let blinkStarted = -1000;
    let greetingStarted = -10000;
    let curious = false;
    let rect = node.getBoundingClientRect();
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0, curious: 0 };
    const images: HTMLImageElement[] = [];
    const textures: WebGLTexture[] = [];
    const gl = surface.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, depth: false, powerPreference: 'low-power' });
    if (!gl) return;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    const shaders: WebGLShader[] = [];
    const uniforms: Record<string, WebGLUniformLocation | null> = {};

    function shader(type: number, text: string) {
      const item = gl!.createShader(type);
      if (!item) throw new Error('Shader unavailable');
      shaders.push(item);
      gl!.shaderSource(item, text);
      gl!.compileShader(item);
      if (!gl!.getShaderParameter(item, gl!.COMPILE_STATUS)) throw new Error('Avatar shader compilation failed');
      return item;
    }
    function loadImage(url: string, done: (image: HTMLImageElement) => void) {
      const image = new window.Image();
      images.push(image);
      image.onload = () => { if (!disposed && !contextLost) done(image); };
      image.onerror = () => { /* Keep the original portrait if an optional expression cannot load. */ };
      image.src = url;
    }
    function upload(image: HTMLImageElement, unit: number) {
      gl!.activeTexture(gl!.TEXTURE0 + unit);
      gl!.bindTexture(gl!.TEXTURE_2D, textures[unit]);
      gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, image);
    }
    function measure() {
      rect = node!.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.round(rect.width * 1.08 * ratio);
      const height = Math.round(rect.height * 1.08 * ratio);
      if (surface!.width !== width || surface!.height !== height) { surface!.width = width; surface!.height = height; }
      gl!.viewport(0, 0, width, height);
    }
    function draw(now: number) {
      frame = 0;
      if (disposed || contextLost || !program || !baseReady) return;
      const moving = visible && !document.hidden && !pausedRef.current;
      const delta = previousTime ? Math.min((now - previousTime) / 1000, .05) : .016;
      previousTime = now;
      const follow = 1 - Math.exp(-delta * 9);
      current.x += ((moving ? target.x : 0) - current.x) * (moving ? follow : 1);
      current.y += ((moving ? target.y : 0) - current.y) * (moving ? follow : 1);
      current.curious += ((curious && moving ? 1 : 0) - current.curious) * (moving ? follow : 1);
      if (moving && hasBlink && now >= nextBlink) {
        blinkStarted = now;
        nextBlink = now + 3700 + Math.random() * 2400;
      }
      const blinkElapsed = now - blinkStarted;
      const blink = moving && blinkElapsed < 220 ? (blinkElapsed < 85 ? blinkElapsed / 85 : blinkElapsed < 115 ? 1 : 1 - (blinkElapsed - 115) / 105) : 0;
      const greetElapsed = now - greetingStarted;
      const greet = greetElapsed >= 0 && greetElapsed < 2400;
      const happy = hasHappy && greet ? (moving ? Math.min(greetElapsed / 180, 1, (2400 - greetElapsed) / 350) : 1) : 0;
      const nod = moving && greetElapsed >= 0 && greetElapsed < 900 ? Math.sin(greetElapsed / 900 * Math.PI * 2) * Math.sin(greetElapsed / 900 * Math.PI) * .007 : 0;
      gl!.useProgram(program);
      gl!.uniform2f(uniforms.uGaze, current.x, current.y);
      gl!.uniform1f(uniforms.uBlink, Math.max(0, blink));
      gl!.uniform1f(uniforms.uHappy, Math.max(0, happy));
      gl!.uniform1f(uniforms.uCurious, current.curious);
      gl!.uniform1f(uniforms.uBreath, moving ? Math.sin(now * .0016) * .0012 : 0);
      gl!.uniform1f(uniforms.uNod, nod);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      if (moving) frame = requestAnimationFrame(draw);
    }
    function refresh() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      if (!disposed && !contextLost && program && textures.length) draw(performance.now());
    }
    function pointer(event: PointerEvent) {
      if (pausedRef.current || !visible || event.pointerType === 'touch') return;
      const centerX = rect.left + rect.width * .48;
      const centerY = rect.top + rect.height * .24;
      target.x = Math.max(-1, Math.min(1, (event.clientX - centerX) / (window.innerWidth * .4)));
      target.y = Math.max(-1, Math.min(1, (event.clientY - centerY) / (window.innerHeight * .45)));
    }
    function leave() { target.x = 0; target.y = 0; curious = false; }
    function lost(event: Event) { event.preventDefault(); contextLost = true; cancelAnimationFrame(frame); frame = 0; setReady(false); }
    const resize = new ResizeObserver(() => { measure(); refresh(); });
    const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; refresh(); }, { threshold: .05 });

    try {
      program = gl.createProgram();
      if (!program) throw new Error('Program unavailable');
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Avatar program linking failed');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      for (const name of ['uGaze','uBlink','uHappy','uCurious','uBreath','uNod']) uniforms[name] = gl.getUniformLocation(program, name);
      for (const [unit, name] of ['uPortrait', 'uBlinkPortrait', 'uHappyPortrait'].entries()) {
        const texture = gl.createTexture();
        if (!texture) throw new Error('Texture unavailable');
        textures.push(texture);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(gl.getUniformLocation(program, name), unit);
      }
      loadImage(source, image => {
        for (let unit = 0; unit < 3; unit++) upload(image, unit);
        baseReady = true;
        measure();
        setReady(true);
        refresh();
        loadImage('/images/developer-avatar-blink.webp', expression => { upload(expression, 1); hasBlink = true; });
        loadImage('/images/developer-avatar-happy.webp', expression => { upload(expression, 2); hasHappy = true; });
      });
      controller.current = {
        refresh,
        greet: () => { greetingStarted = performance.now(); refresh(); },
        curious: value => { curious = value; },
      };
      resize.observe(node);
      intersection.observe(node);
      window.addEventListener('pointermove', pointer, { passive: true });
      document.addEventListener('pointerleave', leave);
      window.addEventListener('scroll', measure, { passive: true });
      document.addEventListener('visibilitychange', refresh);
      surface.addEventListener('webglcontextlost', lost);
    } catch {
      // The original image remains visible and the greeting button still works.
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', pointer);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('scroll', measure);
      document.removeEventListener('visibilitychange', refresh);
      surface.removeEventListener('webglcontextlost', lost);
      images.forEach(image => { image.onload = null; image.onerror = null; });
      textures.forEach(texture => gl.deleteTexture(texture));
      shaders.forEach(item => gl.deleteShader(item));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      controller.current = null;
    };
  }, []);

  function sayHello() {
    controller.current?.greet();
    setGreeting(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => { setGreeting(false); controller.current?.refresh(); }, 2450);
  }

  return <button ref={host} className="interactive-avatar" type="button" onClick={sayHello} onPointerEnter={() => controller.current?.curious(true)} onPointerLeave={() => controller.current?.curious(false)} onFocus={() => controller.current?.curious(true)} onBlur={() => controller.current?.curious(false)} aria-label="Say hello to the interactive developer avatar" aria-describedby="avatar-hint" data-ready={ready} data-greeting={greeting}>
    <Image className="avatar-fallback" src={source} alt="" width={1254} height={1254} sizes="(max-width: 600px) 95vw, 530px" preload/>
    <canvas ref={canvas} className="avatar-canvas" aria-hidden="true"/>
    <span className="avatar-greeting" role="status">{greeting ? 'Hey, nice to meet you!' : ''}</span>
  </button>;
}
