'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type * as Three from 'three';

export type SystemMode = 'interface' | 'intelligence' | 'infrastructure';

export interface SystemSculptureProps {
  mode: SystemMode;
  /** Freezes ambient movement. Direct manipulation and mode selection still work. */
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
  onReady?: () => void;
}

const COUNT = 64;
const COLORS = ['#4288df', '#a6cafa', '#233449', '#d8e7fb', '#4288df', '#7cabeb', '#f2f6fc'];
const colorFor = (index: number) => COLORS[(index * 11 + Math.floor(index / 8) * 3) % COLORS.length];
type Controller = { setMode: (mode: SystemMode) => void; refresh: () => void };

/**
 * Decorative, directly manipulable sculpture. The parent owns the accessible
 * mode controls, instructions, and selected-mode description.
 * Give its parent an explicit height or aspect ratio.
 */
export default function SystemSculpture({
  mode,
  paused = false,
  className,
  style,
  onReady,
}: SystemSculptureProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const modeRef = useRef(mode);
  const pausedRef = useRef(paused);
  const readyRef = useRef(onReady);
  const [surface, setSurface] = useState<'pending' | 'ready' | 'unavailable'>('pending');

  useEffect(() => {
    modeRef.current = mode;
    controllerRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    pausedRef.current = paused;
    controllerRef.current?.refresh();
  }, [paused]);

  useEffect(() => { readyRef.current = onReady; }, [onReady]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let released = false;
    let renderer: Three.WebGLRenderer | undefined;
    let environment: Three.WebGLRenderTarget | undefined;
    let geometry: Three.BufferGeometry | undefined;
    let material: Three.Material | undefined;
    let lineGeometry: Three.BufferGeometry | undefined;
    let lineMaterial: Three.Material | undefined;
    let instances: Three.InstancedMesh | undefined;
    let raf = 0;
    const disposers: Array<() => void> = [];

    const release = () => {
      if (released) return;
      released = true;
      cancelAnimationFrame(raf);
      raf = 0;
      for (const dispose of disposers.splice(0)) dispose();
      instances?.dispose();
      geometry?.dispose();
      material?.dispose();
      lineGeometry?.dispose();
      lineMaterial?.dispose();
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };

    void (async () => {
      try {
        // These dependencies never enter the server-rendered module graph.
        const [THREE, { RoomEnvironment }, { RoundedBoxGeometry }] = await Promise.all([
          import('three'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
          import('three/examples/jsm/geometries/RoundedBoxGeometry.js'),
        ]);
        if (cancelled) return;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        const canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline:none;';
        host.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 50);
        camera.position.set(0, 0, 8.1);
        const object = new THREE.Group();
        scene.add(object);

        const room = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(renderer);
        try {
          environment = pmrem.fromScene(room, 0.025);
          scene.environment = environment.texture;
        } finally {
          room.dispose();
          pmrem.dispose();
        }
        scene.add(new THREE.HemisphereLight(0xf5f9ff, 0x607da3, 2.2));
        const key = new THREE.DirectionalLight(0xffffff, 3.0);
        key.position.set(-3, 5, 6);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xd6e8ff, 1.4);
        rim.position.set(4, 2, -3);
        scene.add(rim);

        geometry = new RoundedBoxGeometry(0.40, 0.40, 0.40, 2, 0.055);
        material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0.055,
          roughness: 0.28,
          envMapIntensity: 0.65,
        });
        const blocks = new THREE.InstancedMesh(geometry, material, COUNT);
        instances = blocks;
        blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        // The bounds change during a morph; this tiny fixed-count mesh is always visible.
        blocks.frustumCulled = false;
        for (let i = 0; i < COUNT; i++) blocks.setColorAt(i, new THREE.Color(colorFor(i)));
        object.add(blocks);

        const current = Array.from({ length: COUNT }, () => ({
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        }));
        const targets = Array.from({ length: COUNT }, () => ({
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        }));
        const sphere = Array.from({ length: COUNT }, (_, i) => {
          const inner = i >= 52;
          const k = inner ? i - 52 : i;
          const n = inner ? 12 : 52;
          const y = 1 - ((k + 0.5) / n) * 2;
          const radius = inner ? 0.72 : 1.59 + Math.sin(i * 1.7) * 0.055;
          const ring = Math.sqrt(1 - y * y);
          const theta = k * Math.PI * (3 - Math.sqrt(5)) + (inner ? 0.8 : 0);
          return new THREE.Vector3(Math.cos(theta) * ring * radius, y * radius, Math.sin(theta) * ring * radius);
        });

        // A small nearest-neighbor graph reinforces the network form without
        // turning the sculpture into a dense wireframe or a second render layer.
        const edges: Array<[number, number]> = [];
        const seen = new Set<string>();
        for (let i = 0; i < COUNT; i++) {
          const nearest = sphere
            .map((point, j) => ({ j, distance: i === j ? Infinity : sphere[i].distanceToSquared(point) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 2);
          for (const { j } of nearest) {
            const a = Math.min(i, j);
            const b = Math.max(i, j);
            const key = `${a}:${b}`;
            if (!seen.has(key)) { seen.add(key); edges.push([a, b]); }
          }
        }
        const linePositions = new Float32Array(edges.length * 6);
        lineGeometry = new THREE.BufferGeometry();
        const lineAttribute = new THREE.BufferAttribute(linePositions, 3);
        lineAttribute.setUsage(THREE.DynamicDrawUsage);
        lineGeometry.setAttribute('position', lineAttribute);
        const connectorsMaterial = new THREE.LineBasicMaterial({
          color: 0x6386b3,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        lineMaterial = connectorsMaterial;
        const connectors = new THREE.LineSegments(lineGeometry, connectorsMaterial);
        connectors.frustumCulled = false;
        object.add(connectors);

        const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let reduced = reducedQuery.matches;
        let inView = true;
        let lastTime = 0;
        let idleTime = 0;
        let selected = modeRef.current;
        let lineOpacity = selected === 'intelligence' ? 0.24 : 0;
        const targetOrientation = new THREE.Vector3();
        const orientation = new THREE.Vector3();
        const userRotation = new THREE.Vector2();
        const targetUserRotation = new THREE.Vector2();
        const hover = new THREE.Vector2();
        const targetHover = new THREE.Vector2();
        const dummy = new THREE.Object3D();
        const euler = new THREE.Euler();

        const chooseForm = (next: SystemMode) => {
          selected = next;
          if (next === 'interface') targetOrientation.set(0.16, -0.26, -0.075);
          if (next === 'intelligence') targetOrientation.set(0.18, -0.30, 0.025);
          if (next === 'infrastructure') targetOrientation.set(0.24, -0.57, 0.015);
          for (let i = 0; i < COUNT; i++) {
            const target = targets[i];
            if (next === 'interface') {
              const x = (i % 8 - 3.5) * 0.475;
              const y = (Math.floor(i / 8) - 3.5) * 0.475;
              target.position.set(x, y, -0.105 * x * x + 0.025 * y * y);
              target.quaternion.setFromEuler(euler.set(y * 0.045, x * 0.16, 0));
              target.scale.set(1, 1, 0.62);
            } else if (next === 'intelligence') {
              target.position.copy(sphere[i]);
              target.quaternion.setFromEuler(euler.set(i * 0.29, i * 0.37, i * 0.17));
              target.scale.setScalar(i >= 52 ? 0.73 : 0.90);
            } else {
              const tower = Math.floor(i / 16);
              const floor = Math.floor((i % 16) / 2);
              const side = i % 2;
              const x = (tower % 2 === 0 ? -0.96 : 0.96) + (side - 0.5) * 0.44;
              const z = tower < 2 ? -0.78 : 0.78;
              // Four architecturally ordered towers, with a slight height rhythm.
              const spacing = [0.425, 0.475, 0.455, 0.405][tower];
              target.position.set(x, -1.59 + floor * spacing, z);
              target.quaternion.identity();
              target.scale.set(0.96, 0.92, 0.96);
            }
          }
        };

        const snapToTarget = () => {
          for (let i = 0; i < COUNT; i++) {
            current[i].position.copy(targets[i].position);
            current[i].quaternion.copy(targets[i].quaternion);
            current[i].scale.copy(targets[i].scale);
          }
          orientation.copy(targetOrientation);
          lineOpacity = selected === 'intelligence' ? 0.24 : 0;
        };

        const canRender = () => !cancelled && !released && inView && !document.hidden;
        const canAnimate = () => canRender() && !pausedRef.current && !reduced;

        const draw = (time: number) => {
          raf = 0;
          if (!canRender()) { lastTime = 0; return; }
          const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60;
          lastTime = time;
          const animate = canAnimate();
          const blend = animate ? 1 - Math.exp(-dt * 5.8) : 1;
          if (animate) idleTime += dt;
          orientation.lerp(targetOrientation, blend);
          userRotation.lerp(targetUserRotation, blend);
          hover.lerp(targetHover, blend);
          object.rotation.set(
            orientation.x + userRotation.y + hover.y * 0.035 + (reduced ? 0 : Math.sin(idleTime * 0.31) * 0.018),
            orientation.y + userRotation.x + hover.x * 0.06 + (reduced ? 0 : Math.sin(idleTime * 0.24) * 0.12),
            orientation.z,
          );
          object.position.y = reduced ? 0 : Math.sin(idleTime * 0.6) * 0.055;
          for (let i = 0; i < COUNT; i++) {
            const item = current[i];
            item.position.lerp(targets[i].position, blend);
            item.quaternion.slerp(targets[i].quaternion, blend);
            item.scale.lerp(targets[i].scale, blend);
            dummy.position.copy(item.position);
            dummy.quaternion.copy(item.quaternion);
            dummy.scale.copy(item.scale);
            dummy.updateMatrix();
            blocks.setMatrixAt(i, dummy.matrix);
          }
          blocks.instanceMatrix.needsUpdate = true;
          lineOpacity += ((selected === 'intelligence' ? 0.24 : 0) - lineOpacity) * blend;
          connectorsMaterial.opacity = lineOpacity;
          connectors.visible = lineOpacity > 0.003;
          if (connectors.visible) {
            for (let e = 0; e < edges.length; e++) {
              const [a, b] = edges[e];
              current[a].position.toArray(linePositions, e * 6);
              current[b].position.toArray(linePositions, e * 6 + 3);
            }
            lineAttribute.needsUpdate = true;
          }
          renderer!.render(scene, camera);
          if (canAnimate()) raf = requestAnimationFrame(draw);
        };

        const requestDraw = () => {
          if (!canRender()) {
            cancelAnimationFrame(raf);
            raf = 0;
            lastTime = 0;
          } else if (!raf) {
            lastTime = 0;
            raf = requestAnimationFrame(draw);
          }
        };

        const resize = () => {
          const { width, height } = host.getBoundingClientRect();
          if (!width || !height) return;
          renderer!.setSize(width, height, false);
          camera.aspect = width / height;
          // Preserve comfortable margins in both narrow mobile and wide desktop frames.
          camera.position.z = Math.max(8.1, 7.1 / camera.aspect);
          camera.updateProjectionMatrix();
          requestDraw();
        };

        type Drag = {
          id: number; x: number; y: number; yaw: number; pitch: number;
          active: boolean; touch: boolean;
        };
        let drag: Drag | null = null;
        const pointerDown = (event: PointerEvent) => {
          if (!event.isPrimary || event.button !== 0) return;
          const touch = event.pointerType === 'touch';
          drag = {
            id: event.pointerId, x: event.clientX, y: event.clientY,
            yaw: targetUserRotation.x, pitch: targetUserRotation.y,
            active: !touch, touch,
          };
          if (!touch) {
            canvas.setPointerCapture(event.pointerId);
            canvas.style.cursor = 'grabbing';
            event.preventDefault();
          }
        };
        const pointerMove = (event: PointerEvent) => {
          if (!drag) {
            if (event.pointerType === 'mouse') {
              const rect = canvas.getBoundingClientRect();
              targetHover.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
              requestDraw();
            }
            return;
          }
          if (event.pointerId !== drag.id) return;
          const dx = event.clientX - drag.x;
          const dy = event.clientY - drag.y;
          if (!drag.active) {
            // Let vertical gestures remain native page scroll; a tap never captures.
            if (Math.abs(dy) > 9 && Math.abs(dy) >= Math.abs(dx)) { drag = null; return; }
            if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
            drag.active = true;
            canvas.setPointerCapture(event.pointerId);
            canvas.style.cursor = 'grabbing';
          }
          if (event.cancelable) event.preventDefault();
          targetUserRotation.set(drag.yaw + dx * 0.006, THREE.MathUtils.clamp(drag.pitch + dy * 0.004, -0.65, 0.65));
          targetHover.set(0, 0);
          requestDraw();
        };
        const pointerUp = (event: PointerEvent) => {
          if (drag?.id !== event.pointerId) return;
          drag = null;
          if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
          canvas.style.cursor = 'grab';
        };
        const pointerLeave = () => {
          targetHover.set(0, 0);
          requestDraw();
        };
        const reducedChanged = () => {
          reduced = reducedQuery.matches;
          if (reduced) snapToTarget();
          requestDraw();
        };
        const visibilityChanged = () => requestDraw();
        const contextLost = (event: Event) => {
          event.preventDefault();
          controllerRef.current = null;
          release();
          if (!cancelled) setSurface('unavailable');
        };

        canvas.addEventListener('pointerdown', pointerDown);
        canvas.addEventListener('pointermove', pointerMove, { passive: false });
        canvas.addEventListener('pointerup', pointerUp);
        canvas.addEventListener('pointercancel', pointerUp);
        canvas.addEventListener('lostpointercapture', pointerUp);
        canvas.addEventListener('pointerleave', pointerLeave);
        canvas.addEventListener('webglcontextlost', contextLost);
        reducedQuery.addEventListener('change', reducedChanged);
        document.addEventListener('visibilitychange', visibilityChanged);
        disposers.push(() => {
          canvas.removeEventListener('pointerdown', pointerDown);
          canvas.removeEventListener('pointermove', pointerMove);
          canvas.removeEventListener('pointerup', pointerUp);
          canvas.removeEventListener('pointercancel', pointerUp);
          canvas.removeEventListener('lostpointercapture', pointerUp);
          canvas.removeEventListener('pointerleave', pointerLeave);
          canvas.removeEventListener('webglcontextlost', contextLost);
          reducedQuery.removeEventListener('change', reducedChanged);
          document.removeEventListener('visibilitychange', visibilityChanged);
        });

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        const intersectionObserver = new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          requestDraw();
        }, { rootMargin: '100px', threshold: 0 });
        intersectionObserver.observe(host);
        disposers.push(() => resizeObserver.disconnect(), () => intersectionObserver.disconnect());

        controllerRef.current = {
          setMode: (next) => {
            chooseForm(next);
            if (reduced || pausedRef.current) snapToTarget();
            requestDraw();
          },
          refresh: () => {
            if (pausedRef.current) snapToTarget();
            requestDraw();
          },
        };
        chooseForm(modeRef.current);
        snapToTarget();
        resize();
        setSurface('ready');
        // A consumer callback is separate from initialization and cannot cause a
        // healthy renderer to be mistaken for a failed WebGL context.
        queueMicrotask(() => { if (!cancelled && !released) readyRef.current?.(); });
      } catch {
        release();
        if (!cancelled) {
          controllerRef.current = null;
          setSurface('unavailable');
          queueMicrotask(() => { if (!cancelled) readyRef.current?.(); });
        }
      }
    })();

    return () => {
      cancelled = true;
      controllerRef.current = null;
      release();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={className}
      data-sculpture-state={surface}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 260, overflow: 'hidden', ...style }}
    >
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
      {surface !== 'ready' && (
        <div style={{ position: 'absolute', inset: '15% 20%', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 'clamp(3px, .6vw, 7px)', alignContent: 'center', transform: 'perspective(700px) rotateX(18deg) rotate(-11deg)' }}>
          {Array.from({ length: COUNT }, (_, i) => (
            <span key={i} style={{ aspectRatio: '1', borderRadius: '18%', background: colorFor(i), boxShadow: '3px 4px 0 rgba(43, 34, 83, .13)', opacity: 0.92 }} />
          ))}
        </div>
      )}
    </div>
  );
}
