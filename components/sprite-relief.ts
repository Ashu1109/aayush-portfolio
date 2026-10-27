import * as THREE from "three";

/**
 * Renders the sprite art as real geometry: each frame's silhouette is
 * inflated into a rounded height field and a dense plane is displaced by it,
 * so turning the mesh gives true depth parallax instead of a flat card.
 *
 * The painted texture is sacred: an orthographic camera puts every pixel
 * exactly where the art has it, and lighting only applies the *change* from
 * the rest pose and light, so at rest the sprite looks exactly like the
 * render. Turning dims the side that turns away; moving the light makes the
 * dew beads glint.
 *
 * The camera frames a plane 2 units tall exactly, so callers mirror it in
 * CSS without perspective: a point at relief height h sits at
 * translateZ(h * DEPTH * height / 2 px).
 */

export const RELIEF_DEPTH = 0.55;

// Where the light sits when the cursor is at rest (y up, toward the viewer).
const REST_LIGHT = new THREE.Vector3(0, 0.35, 0.9).normalize();

const SEGMENTS = 192;
const FIELD_WIDTH = 256;

export type ReliefFrame = { file: string; height: number; name: string; width: number };

type Field = { data: Float32Array; height: number; width: number };

/** Inflate the alpha silhouette into a dome: 0 at the edge, 1 at the deepest point. */
const inflate = (image: CanvasImageSource, aspect: number): Field => {
  const width = FIELD_WIDTH;
  const height = Math.round(FIELD_WIDTH / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { data: new Float32Array(width * height), height, width };
  }
  ctx.drawImage(image, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;

  // Two-pass chamfer distance (3/4 weights) from the outside of the shape.
  const dist = new Float32Array(width * height);
  for (let i = 0; i < dist.length; i++) {
    dist[i] = pixels[i * 4 + 3] > 127 ? 1e6 : 0;
  }
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? 0 : dist[y * width + x];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (dist[i] > 0) {
        dist[i] = Math.min(dist[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
      }
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      if (dist[i] > 0) {
        dist[i] = Math.min(dist[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
      }
    }
  }

  let max = 1;
  for (const d of dist) {
    max = Math.max(max, d);
  }
  // A distance field is a roof: sharp creases along the shape's spine that
  // light up as hard triangles. A wide separable blur (three box passes, close
  // to a Gaussian) rounds them off before the profile is applied.
  let field = dist.map((d) => d / max);
  const radius = Math.max(2, Math.round(width * 0.035));
  const boxBlur = (src: Float32Array, horizontal: boolean) => {
    const out = new Float32Array(src.length);
    const [outer, inner] = horizontal ? [height, width] : [width, height];
    for (let o = 0; o < outer; o++) {
      let sum = 0;
      const index = (i: number) => (horizontal ? o * width + i : i * width + o);
      for (let i = -radius; i <= radius; i++) {
        sum += src[index(Math.min(inner - 1, Math.max(0, i)))];
      }
      for (let i = 0; i < inner; i++) {
        out[index(i)] = sum / (radius * 2 + 1);
        sum += src[index(Math.min(inner - 1, i + radius + 1))] - src[index(Math.max(0, i - radius))];
      }
    }
    return out;
  };
  for (let pass = 0; pass < 3; pass++) {
    field = boxBlur(boxBlur(field, true), false);
  }
  let peak = 1e-6;
  for (const s of field) {
    peak = Math.max(peak, s);
  }
  // Circular profile: steep at the rim, rounded on top, like a soft blob.
  field = field.map((value) => {
    const s = value / peak;
    return Math.sqrt(Math.max(0, 2 * s - s * s));
  });
  return { data: field, height, width };
};

const VERTEX = /* glsl */ `
  uniform sampler2D uHeight;
  uniform float uDepth;
  uniform float uAspect;
  uniform float uFlip;
  varying vec2 vUv;
  void main() {
    vUv = vec2(mix(uv.x, 1.0 - uv.x, uFlip), uv.y);
    float h = texture2D(uHeight, vUv).r;
    vec3 p = vec3(position.x * uAspect, position.y, h * uDepth);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uHeight;
  uniform vec2 uFieldTexel;
  uniform vec2 uMapTexel;
  uniform float uDepth;
  uniform float uAspect;
  uniform float uFlip;
  uniform mat3 uRot;
  uniform vec3 uLight;
  uniform vec3 uRest;
  varying vec2 vUv;

  float lum(vec2 uv) { return dot(texture2D(uMap, uv).rgb, vec3(0.299, 0.587, 0.114)); }

  void main() {
    vec4 base = texture2D(uMap, vUv);
    float alpha = smoothstep(0.35, 0.65, base.a);
    if (alpha < 0.01) discard;

    // Shape normal from the height field (mirror-aware: x runs backwards when flipped).
    float side = mix(1.0, -1.0, uFlip);
    float hx = texture2D(uHeight, vUv + vec2(uFieldTexel.x, 0.0)).r - texture2D(uHeight, vUv - vec2(uFieldTexel.x, 0.0)).r;
    float hy = texture2D(uHeight, vUv + vec2(0.0, uFieldTexel.y)).r - texture2D(uHeight, vUv - vec2(0.0, uFieldTexel.y)).r;
    vec2 slope = vec2(side * hx / (4.0 * uFieldTexel.x * uAspect), hy / (4.0 * uFieldTexel.y)) * uDepth;

    // Surface detail from the art's own luminance: the dew beads become bumps.
    float gx = lum(vUv + vec2(uMapTexel.x, 0.0)) - lum(vUv - vec2(uMapTexel.x, 0.0));
    float gy = lum(vUv + vec2(0.0, uMapTexel.y)) - lum(vUv - vec2(0.0, uMapTexel.y));
    vec3 n = normalize(vec3(-slope.x - side * gx * 1.6, -slope.y - gy * 1.6, 1.0));

    vec3 N = normalize(uRot * n);
    vec3 L = normalize(uLight);
    vec3 R = normalize(uRest);
    vec3 V = vec3(0.0, 0.0, 1.0);
    float brightness = dot(base.rgb, vec3(0.299, 0.587, 0.114));

    // Only the change from rest: zero at rest, so the painted texture shows
    // untouched; the side that turns away (or away from the light) dims.
    // Capped so moving the light can only nudge the painted values, never repaint them.
    float shade = clamp(1.0 + 0.3 * (dot(N, L) - dot(n, R)), 0.84, 1.1);
    // Bead glints appear only where the moved light newly catches a bump.
    float glint = pow(max(dot(N, normalize(L + V)), 0.0), 260.0) - pow(max(dot(n, normalize(R + V)), 0.0), 260.0);
    float sparkle = max(glint, 0.0) * 0.9 * smoothstep(0.55, 0.9, brightness);

    vec3 color = base.rgb * shade + vec3(1.0, 0.98, 0.92) * sparkle;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

export type Relief = ReturnType<typeof createRelief>;

export const createRelief = (canvas: HTMLCanvasElement, frames: readonly ReliefFrame[]) => {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  // Orthographic: the art keeps its exact proportions (no perspective bulge).
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(0, 0, 10);

  const uniforms = {
    uAspect: { value: 1 },
    uDepth: { value: RELIEF_DEPTH },
    uFieldTexel: { value: new THREE.Vector2(1 / FIELD_WIDTH, 1 / FIELD_WIDTH) },
    uFlip: { value: 0 },
    uHeight: { value: null as THREE.Texture | null },
    uLight: { value: REST_LIGHT.clone() },
    uMap: { value: null as THREE.Texture | null },
    uMapTexel: { value: new THREE.Vector2(1 / 441, 1 / 428) },
    uRest: { value: REST_LIGHT },
    uRot: { value: new THREE.Matrix3() },
  };
  const material = new THREE.ShaderMaterial({
    fragmentShader: FRAGMENT,
    premultipliedAlpha: true,
    transparent: true,
    uniforms,
    vertexShader: VERTEX,
  });
  const geometry = new THREE.PlaneGeometry(2, 2, SEGMENTS, SEGMENTS);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const loaded = new Map<string, { field: Field; height: THREE.DataTexture; map: THREE.Texture; meta: ReliefFrame }>();
  const loader = new THREE.TextureLoader();

  const ready = Promise.all(
    frames.map(async (meta) => {
      const map = await loader.loadAsync(`/sprite/${meta.file}.webp`);
      map.colorSpace = THREE.NoColorSpace;
      map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const field = inflate(map.image as CanvasImageSource, meta.width / meta.height);
      // Rows were read top-down; the plane's v runs bottom-up, so flip them.
      // Half floats: smooth enough for normals, and linear filtering on them
      // is core WebGL2 (full floats need an extension mobile GPUs lack).
      const rows = new Uint16Array(field.data.length);
      for (let y = 0; y < field.height; y++) {
        for (let x = 0; x < field.width; x++) {
          rows[(field.height - 1 - y) * field.width + x] = THREE.DataUtils.toHalfFloat(field.data[y * field.width + x]);
        }
      }
      const height = new THREE.DataTexture(rows, field.width, field.height, THREE.RedFormat, THREE.HalfFloatType);
      height.magFilter = THREE.LinearFilter;
      height.minFilter = THREE.LinearFilter;
      height.needsUpdate = true;
      loaded.set(meta.name, { field, height, map, meta });
    })
  );

  let current = "";
  let flip = false;

  const setFrame = (name: string, mirrored: boolean) => {
    const entry = loaded.get(name);
    if (!entry) {
      return;
    }
    current = name;
    flip = mirrored;
    uniforms.uMap.value = entry.map;
    uniforms.uHeight.value = entry.height;
    uniforms.uAspect.value = entry.meta.width / entry.meta.height;
    uniforms.uFieldTexel.value.set(1 / entry.field.width, 1 / entry.field.height);
    uniforms.uMapTexel.value.set(1 / entry.meta.width, 1 / entry.meta.height);
    uniforms.uFlip.value = mirrored ? 1 : 0;
  };

  /** Relief height (0..1) at a point of a frame, in that frame's pixels. */
  const heightAt = (name: string, x: number, y: number) => {
    const entry = loaded.get(name);
    if (!entry) {
      return 0;
    }
    const { field, meta } = entry;
    const fx = Math.round((x / meta.width) * (field.width - 1));
    const fy = Math.round((y / meta.height) * (field.height - 1));
    return field.data[fy * field.width + fx] ?? 0;
  };

  /** Yaw and pitch in radians (positive yaw turns the face to the viewer's right). */
  const setPose = (yaw: number, pitch: number) => {
    mesh.rotation.set(pitch, yaw, 0);
    mesh.updateMatrixWorld();
    uniforms.uRot.value.setFromMatrix4(mesh.matrixWorld);
  };

  /** Light from the cursor: x, y in [-1, 1], y down like the screen; (0, 0) is rest. */
  const setLight = (x: number, y: number) => {
    uniforms.uLight.value.set(x * 1.1, -y * 0.9 + 0.35, 0.9);
  };

  const resize = (width: number, height: number) => {
    renderer.setSize(width, height, false);
    const aspect = width / Math.max(1, height);
    camera.left = -aspect;
    camera.right = aspect;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    if (current) {
      renderer.render(scene, camera);
    }
  };

  const dispose = () => {
    loaded.forEach((entry) => {
      entry.map.dispose();
      entry.height.dispose();
    });
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };

  return { dispose, flipped: () => flip, heightAt, ready, render, resize, setFrame, setLight, setPose };
};
