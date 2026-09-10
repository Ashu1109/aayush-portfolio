"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./OrbitalSculpture.module.css";

export type OrbitalSculptureProps = {
  /** Freeze the sculpture at its current orientation. */
  paused?: boolean;
  className?: string;
};

/** A procedural sculpture: no model, texture downloads, or animation framework. */
export default function OrbitalSculpture({
  paused = false,
  className,
}: OrbitalSculptureProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<{ sync: () => void } | null>(null);
  const pausedRef = useRef(paused);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
    runtimeRef.current?.sync();
  }, [paused]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];
    const dispose = () => {
      for (const cleanup of cleanups.splice(0).reverse()) {
        try { cleanup(); } catch { /* Release the remaining resources as well. */ }
      }
    };

    async function initialize() {
      // Keeping these imports inside the effect gives the renderer its own chunk
      // and leaves the CSS sculpture visible during loading or on unsupported GPUs.
      const [THREE, { RoomEnvironment }] = await Promise.all([
        import("three"),
        import("three/addons/environments/RoomEnvironment.js"),
      ]);
      if (cancelled || !host) return;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      });
      cleanups.push(() => {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.domElement.className = styles.canvas;
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      cleanups.push(() => scene.clear());
      const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 30);
      camera.position.set(0, 0.06, 6.6);
      camera.lookAt(0, 0, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      let environment: ReturnType<typeof pmrem.fromScene>;
      try {
        environment = pmrem.fromScene(room, 0.04);
      } finally {
        room.dispose();
        pmrem.dispose();
      }
      cleanups.push(() => environment.dispose());
      scene.environment = environment.texture;

      const key = new THREE.DirectionalLight(0xf5f6e8, 4.2);
      key.position.set(-3.5, 5, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xcbd4b6, 2.0);
      rim.position.set(4, 1, -2);
      scene.add(rim);
      const greenLight = new THREE.PointLight(0xc7ff65, 2.2, 4, 2);
      greenLight.position.set(0.15, -0.08, 0.32);
      scene.add(greenLight);

      const pointerGroup = new THREE.Group();
      scene.add(pointerGroup);
      const sculpture = new THREE.Group();
      sculpture.rotation.set(-0.45, 0.22, -0.38);
      pointerGroup.add(sculpture);

      // One continuous three-lobed form provides an intentional silhouette.
      // Low segment counts keep geometry comfortably below 10k vertices.
      const chromeGeometry = new THREE.TorusKnotGeometry(1.04, 0.135, 216, 18, 2, 3);
      cleanups.push(() => chromeGeometry.dispose());
      const chromeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xdde0d2,
        metalness: 1,
        roughness: 0.17,
        clearcoat: 0.45,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.4,
      });
      cleanups.push(() => chromeMaterial.dispose());
      const chrome = new THREE.Mesh(chromeGeometry, chromeMaterial);
      sculpture.add(chrome);

      // A fine, offset orbit adds tension around the heavier sculptural knot.
      const orbitGeometry = new THREE.TorusGeometry(1.58, 0.012, 8, 112);
      cleanups.push(() => orbitGeometry.dispose());
      const orbitMaterial = new THREE.MeshStandardMaterial({
        color: 0x9da981,
        metalness: 0.92,
        roughness: 0.3,
        envMapIntensity: 1.15,
      });
      cleanups.push(() => orbitMaterial.dispose());
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.set(0.83, -0.56, 0.15);
      sculpture.add(orbit);

      const coreGeometry = new THREE.SphereGeometry(0.37, 40, 28);
      cleanups.push(() => coreGeometry.dispose());
      const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x788f35,
        emissive: 0xaed944,
        emissiveIntensity: 0.29,
        metalness: 0.45,
        roughness: 0.19,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.1,
      });
      cleanups.push(() => coreMaterial.dispose());
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      pointerGroup.add(core);

      // Crisp latitude details read as engineered surface, rather than particles.
      const detailGeometry = new THREE.TorusGeometry(0.374, 0.005, 6, 64);
      cleanups.push(() => detailGeometry.dispose());
      const detailMaterial = new THREE.MeshBasicMaterial({
        color: 0xd6ff7b,
        transparent: true,
        opacity: 0.65,
      });
      cleanups.push(() => detailMaterial.dispose());
      const equator = new THREE.Mesh(detailGeometry, detailMaterial);
      equator.rotation.set(0.85, -0.4, 0.1);
      core.add(equator);

      // A small, procedurally painted halo supplies glow without postprocessing.
      const haloCanvas = document.createElement("canvas");
      haloCanvas.width = haloCanvas.height = 128;
      const haloContext = haloCanvas.getContext("2d");
      let haloTexture: InstanceType<typeof THREE.CanvasTexture> | undefined;
      let haloMaterial: InstanceType<typeof THREE.SpriteMaterial> | undefined;
      if (haloContext) {
        const gradient = haloContext.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(187, 242, 87, 0.18)");
        gradient.addColorStop(0.28, "rgba(173, 224, 71, 0.10)");
        gradient.addColorStop(0.66, "rgba(145, 191, 49, 0.025)");
        gradient.addColorStop(1, "rgba(145, 191, 49, 0)");
        haloContext.fillStyle = gradient;
        haloContext.fillRect(0, 0, 128, 128);
        haloTexture = new THREE.CanvasTexture(haloCanvas);
        cleanups.push(() => haloTexture?.dispose());
        haloTexture.colorSpace = THREE.SRGBColorSpace;
        haloMaterial = new THREE.SpriteMaterial({
          map: haloTexture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        cleanups.push(() => haloMaterial?.dispose());
        const halo = new THREE.Sprite(haloMaterial);
        halo.scale.setScalar(2.7);
        halo.position.z = -0.6;
        pointerGroup.add(halo);
      }

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      let reducedMotion = motionQuery.matches;
      let visible = true;
      let contextLost = false;
      let frame = 0;
      let previousTime = 0;
      let elapsed = 0;
      let displayed = false;
      const pointer = { x: 0, y: 0 };

      const markRendered = (value: boolean) => {
        if (!cancelled && displayed !== value) {
          displayed = value;
          setRendered(value);
        }
      };
      const canRender = () => !cancelled && visible && !document.hidden && !contextLost;
      const canAnimate = () => canRender() && !reducedMotion && !pausedRef.current;

      function draw(time: number) {
        frame = 0;
        if (!canRender()) return;
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.04) : 0;
        previousTime = time;
        if (!reducedMotion && !pausedRef.current) {
          elapsed += delta;
          const easing = 1 - Math.exp(-delta * 3.5);
          pointerGroup.rotation.y += (pointer.x * 0.16 - pointerGroup.rotation.y) * easing;
          pointerGroup.rotation.x += (pointer.y * 0.11 - pointerGroup.rotation.x) * easing;
          sculpture.rotation.y = 0.22 + elapsed * 0.095;
          sculpture.rotation.z = -0.38 + Math.sin(elapsed * 0.17) * 0.065;
          core.rotation.y = elapsed * 0.06;
        }
        renderer.render(scene, camera);
        markRendered(true);
        if (canAnimate()) frame = window.requestAnimationFrame(draw);
      }

      function sync() {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        if (canRender()) draw(performance.now());
      }

      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (width <= 0 || height <= 0) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // Preserve the complete silhouette in narrow containers.
        camera.position.z = camera.aspect < 1 ? 6.6 / camera.aspect : 6.6;
        camera.updateProjectionMatrix();
        sync();
      };
      const onPointerMove = (event: PointerEvent) => {
        if (reducedMotion || pausedRef.current || event.pointerType === "touch") return;
        const bounds = host.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      };
      const onPointerLeave = () => { pointer.x = 0; pointer.y = 0; };
      const onMotionChange = () => {
        reducedMotion = motionQuery.matches;
        pointer.x = pointer.y = 0;
        sync();
      };
      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        markRendered(false);
        sync();
      };
      const onContextRestored = () => { contextLost = false; sync(); };

      const resizeObserver = new ResizeObserver(resize);
      cleanups.push(() => resizeObserver.disconnect());
      resizeObserver.observe(host);
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      }, { threshold: 0.01 });
      cleanups.push(() => intersectionObserver.disconnect());
      intersectionObserver.observe(host);
      host.addEventListener("pointermove", onPointerMove, { passive: true });
      host.addEventListener("pointerleave", onPointerLeave, { passive: true });
      document.addEventListener("visibilitychange", sync);
      motionQuery.addEventListener("change", onMotionChange);
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);
      renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);
      runtimeRef.current = { sync };

      cleanups.push(() => {
        if (frame) window.cancelAnimationFrame(frame);
        runtimeRef.current = null;
        host.removeEventListener("pointermove", onPointerMove);
        host.removeEventListener("pointerleave", onPointerLeave);
        document.removeEventListener("visibilitychange", sync);
        motionQuery.removeEventListener("change", onMotionChange);
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      });
      resize();
    }

    initialize().catch(() => {
      // WebGL is optional. The static CSS artwork remains usable on failure.
      if (!cancelled) setRendered(false);
      cancelled = true;
      dispose();
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`${styles.root}${className ? ` ${className}` : ""}`}
      data-rendered={rendered}
      aria-hidden="true"
    >
      <div className={styles.fallback}>
        <div className={styles.fallbackGlow} />
        <div className={`${styles.fallbackRing} ${styles.ringOne}`} />
        <div className={`${styles.fallbackRing} ${styles.ringTwo}`} />
        <div className={styles.fallbackCore} />
        <div className={`${styles.fallbackRing} ${styles.ringThree}`} />
      </div>
    </div>
  );
}
