import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useId } from "react";

gsap.registerPlugin(MorphSVGPlugin);

type Ellipse = { cx: number; cy: number; rx: number; ry: number };

/**
 * Where the face sits on each turnaround frame, in that frame's own pixels
 * (the SVG viewBox matches the image, so overlays line up exactly). The baked
 * eyes and mouth were inpainted out of the `-faceless` frames.
 */
export const FACES = {
  front: {
    blush: [{ cx: 138, cy: 268, rx: 27, ry: 20 }, { cx: 338, cy: 266, rx: 24, ry: 19 }],
    eyes: [{ cx: 175, cy: 244.5, rx: 21.5, ry: 23.5 }, { cx: 315.5, cy: 244.5, rx: 18.5, ry: 24 }],
    height: 428,
    mouth: { cx: 248, cy: 273.5, rx: 23.5, ry: 9.5 },
    width: 441,
  },
  "three-quarter": {
    blush: [{ cx: 106, cy: 255, rx: 20, ry: 20 }, { cx: 284, cy: 262, rx: 27, ry: 21 }],
    eyes: [{ cx: 127.8, cy: 235, rx: 15.5, ry: 23.5 }, { cx: 246.5, cy: 239, rx: 20.5, ry: 23.5 }],
    height: 420,
    mouth: { cx: 179.8, cy: 264.5, rx: 21.5, ry: 10 },
    width: 426,
  },
} satisfies Record<string, { blush: Ellipse[]; eyes: Ellipse[]; height: number; mouth: Ellipse; width: number }>;

export type FaceFrame = keyof typeof FACES;

type EyeState = "open" | "arc" | "sleepy" | "closed" | "squint" | "heart";
type MouthShape = "neutral" | "smile" | "open" | "small" | "yawn";

export const MOODS = {
  asleep: { blush: 0.15, eyes: ["closed", "closed"], mouth: "small" },
  dizzy: { blush: 0.3, eyes: ["squint", "squint"], mouth: "open" },
  happy: { blush: 0.85, eyes: ["arc", "arc"], mouth: "smile" },
  love: { blush: 1, eyes: ["heart", "heart"], mouth: "smile" },
  neutral: { blush: 0, eyes: ["open", "open"], mouth: "neutral" },
  sleepy: { blush: 0, eyes: ["sleepy", "sleepy"], mouth: "small" },
  surprised: { blush: 0.25, eyes: ["open", "open"], eyeScale: 1.22, mouth: "open" },
  wink: { blush: 0.6, eyes: ["arc", "open"], mouth: "smile" },
  // A yawn opens slowly; everything else snaps.
  yawn: { blush: 0.1, eyes: ["closed", "closed"], mouth: "yawn", mouthSeconds: 0.8 },
} satisfies Record<
  string,
  { blush: number; eyeScale?: number; eyes: [EyeState, EyeState]; mouth: MouthShape; mouthSeconds?: number }
>;

export type Mood = keyof typeof MOODS;

const K = 0.5523; // cubic-bezier circle constant

const ellipsePath = ({ cx, cy, rx, ry }: Ellipse) =>
  `M${cx - rx} ${cy}C${cx - rx} ${cy - K * ry} ${cx - K * rx} ${cy - ry} ${cx} ${cy - ry}` +
  `C${cx + K * rx} ${cy - ry} ${cx + rx} ${cy - K * ry} ${cx + rx} ${cy}` +
  `C${cx + rx} ${cy + K * ry} ${cx + K * rx} ${cy + ry} ${cx} ${cy + ry}` +
  `C${cx - K * rx} ${cy + ry} ${cx - rx} ${cy + K * ry} ${cx - rx} ${cy}Z`;

const mouthPath = (m: Ellipse, shape: MouthShape) => {
  if (shape === "smile") {
    const [l, r, t] = [m.cx - m.rx * 1.1, m.cx + m.rx * 1.1, m.cy - m.ry * 0.6];
    return (
      `M${l} ${t}C${l + m.rx * 0.6} ${t + m.ry * 0.5} ${r - m.rx * 0.6} ${t + m.ry * 0.5} ${r} ${t}` +
      `C${r - m.rx * 0.1} ${t + m.ry * 2.7} ${l + m.rx * 0.1} ${t + m.ry * 2.7} ${l} ${t}Z`
    );
  }
  if (shape === "open") {
    return ellipsePath({ cx: m.cx, cy: m.cy + m.ry * 0.5, rx: m.rx * 0.42, ry: m.ry * 1.3 });
  }
  if (shape === "small") {
    return ellipsePath({ ...m, rx: m.rx * 0.45, ry: m.ry * 0.45 });
  }
  if (shape === "yawn") {
    return ellipsePath({ cx: m.cx, cy: m.cy + m.ry * 1.6, rx: m.rx * 0.95, ry: m.ry * 3 });
  }
  return ellipsePath(m);
};

const MOUTH_FILL: Record<MouthShape, string> = {
  neutral: "#ec9470",
  open: "#a8452f",
  small: "#ec9470",
  smile: "#d9694a",
  yawn: "#8f3a2a",
};

/** Happy-closed eye: a soft upward arc where the bead was. */
const arcPath = ({ cx, cy, rx, ry }: Ellipse) =>
  `M${cx - rx} ${cy + ry * 0.25}Q${cx} ${cy - ry * 0.75} ${cx + rx} ${cy + ry * 0.25}`;

/** Shut eye (yawning, asleep): a relaxed downward curve. */
const closedPath = ({ cx, cy, rx, ry }: Ellipse) =>
  `M${cx - rx * 0.9} ${cy + ry * 0.1}Q${cx} ${cy + ry * 0.6} ${cx + rx * 0.9} ${cy + ry * 0.1}`;

/** Overwhelmed eye: a chevron pointing at the nose. */
const squintPath = ({ cx, cy, rx, ry }: Ellipse, side: number) =>
  `M${cx - rx * side * 0.8} ${cy - ry * 0.5}L${cx + rx * side * 0.6} ${cy}L${cx - rx * side * 0.8} ${cy + ry * 0.5}`;

const heartPath = ({ cx, cy, rx }: Ellipse) => {
  const s = rx * 1.15;
  return (
    `M${cx} ${cy + s * 0.9}C${cx - s * 1.4} ${cy} ${cx - s * 0.9} ${cy - s * 1.1} ${cx} ${cy - s * 0.35}` +
    `C${cx + s * 0.9} ${cy - s * 1.1} ${cx + s * 1.4} ${cy} ${cx} ${cy + s * 0.9}Z`
  );
};

/**
 * Animated face for one turnaround frame: glossy bead eyes (with glints that
 * hold still against the light while the eye moves), blush, and a mouth that
 * morphs between shapes. Driven imperatively by `createFaceRig`.
 */
export const SpriteFace = ({ className, frame }: { className?: string; frame: FaceFrame }) => {
  const geo = FACES[frame];
  // Unique per instance: the stage sprite and the companion both draw a front face.
  const bead = `bead-${useId().replace(/:/g, "")}`;
  return (
    <svg
      aria-hidden
      className={className}
      data-face={frame}
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${geo.width} ${geo.height}`}
    >
      <defs>
        <radialGradient cx="38%" cy="32%" id={bead} r="75%">
          <stop offset="0" stopColor="#3b2620" />
          <stop offset="0.55" stopColor="#140907" />
          <stop offset="1" stopColor="#050202" />
        </radialGradient>
        <filter id={`${bead}-soft`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id={`${bead}-mouth`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {geo.blush.map((b) => (
        <ellipse
          cx={b.cx}
          cy={b.cy}
          data-blush
          fill="#ff7f86"
          filter={`url(#${bead}-soft)`}
          key={b.cx}
          opacity="0"
          rx={b.rx}
          ry={b.ry}
        />
      ))}
      {geo.eyes.map((eye, index) => {
        const side = index === 0 ? 1 : -1;
        return (
          <g data-eye={index === 0 ? "l" : "r"} key={eye.cx}>
            <g data-bead>
              <ellipse cx={eye.cx} cy={eye.cy} fill="#3a1d15" rx={eye.rx + 1.2} ry={eye.ry + 1.2} />
              <ellipse cx={eye.cx} cy={eye.cy} fill={`url(#${bead})`} rx={eye.rx} ry={eye.ry} />
              <g data-glint>
                <ellipse
                  cx={eye.cx - eye.rx * 0.32}
                  cy={eye.cy - eye.ry * 0.42}
                  fill="#fff"
                  opacity="0.92"
                  rx={eye.rx * 0.3}
                  ry={eye.ry * 0.18}
                  transform={`rotate(-25 ${eye.cx - eye.rx * 0.32} ${eye.cy - eye.ry * 0.42})`}
                />
                <circle
                  cx={eye.cx + eye.rx * 0.35}
                  cy={eye.cy + eye.ry * 0.4}
                  fill="#fff"
                  opacity="0.55"
                  r={eye.rx * 0.1}
                />
              </g>
            </g>
            <path
              d={arcPath(eye)}
              data-arc
              fill="none"
              opacity="0"
              stroke="#24120d"
              strokeLinecap="round"
              strokeWidth={eye.rx * 0.32}
            />
            <path
              d={closedPath(eye)}
              data-closed
              fill="none"
              opacity="0"
              stroke="#24120d"
              strokeLinecap="round"
              strokeWidth={eye.rx * 0.28}
            />
            <path
              d={squintPath(eye, side)}
              data-squint
              fill="none"
              opacity="0"
              stroke="#24120d"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={eye.rx * 0.3}
            />
            <path d={heartPath(eye)} data-heart fill="#ff5c7a" opacity="0" />
          </g>
        );
      })}
      <path d={mouthPath(geo.mouth, "neutral")} data-mouth fill={MOUTH_FILL.neutral} />
      {/* Only shows inside the wide-open yawn. */}
      <ellipse
        cx={geo.mouth.cx}
        cy={geo.mouth.cy + geo.mouth.ry * 3.4}
        data-tongue
        fill="#ef8a7e"
        opacity="0"
        rx={geo.mouth.rx * 0.52}
        ry={geo.mouth.ry * 0.9}
      />
      <ellipse
        cx={geo.mouth.cx}
        cy={geo.mouth.cy - geo.mouth.ry * 0.35}
        data-mouth-shine
        fill={`url(#${bead}-mouth)`}
        opacity="0.7"
        rx={geo.mouth.rx * 0.7}
        ry={geo.mouth.ry * 0.4}
      />
    </svg>
  );
};

const EYE_MARKS: Record<Exclude<EyeState, "open" | "sleepy">, string> = {
  arc: "[data-arc]",
  closed: "[data-closed]",
  heart: "[data-heart]",
  squint: "[data-squint]",
};

/**
 * Imperative controls for every face under `root` (each frame has one; only
 * the visible frame matters). Create inside a GSAP context so it cleans up.
 */
export const createFaceRig = (root: HTMLElement) => {
  const faces = gsap.utils.toArray<SVGSVGElement>("[data-face]", root);
  let mood: Mood = "neutral";

  // Pin every pivot once, in face pixels. Percentage origins are re-measured
  // from a bounding box that shifts as the glints move, and GSAP's
  // smoothOrigin then leaves a translate behind on each tween: repeated
  // doze/wake cycles walked the eyes off the face. Beads pivot low, so a
  // squash reads as the upper lid closing.
  faces.forEach((face) => {
    const geo = FACES[face.dataset.face as FaceFrame];
    face.querySelectorAll<SVGGElement>("[data-eye]").forEach((eye, index) => {
      const { cx, cy, ry } = geo.eyes[index];
      gsap.set(eye, { svgOrigin: `${cx} ${cy}` });
      gsap.set(eye.querySelector("[data-bead]"), { svgOrigin: `${cx} ${cy + ry * 0.7}` });
      gsap.set(eye.querySelectorAll("[data-arc], [data-closed], [data-squint], [data-heart]"), {
        svgOrigin: `${cx} ${cy}`,
      });
    });
    gsap.set(face.querySelector("[data-mouth]"), { svgOrigin: `${geo.mouth.cx} ${geo.mouth.cy}` });
  });

  const setMood = (next: Mood) => {
    mood = next;
    const spec: {
      blush: number;
      eyeScale?: number;
      eyes: EyeState[];
      mouth: MouthShape;
      mouthSeconds?: number;
    } = MOODS[next];
    faces.forEach((face) => {
      const geo = FACES[face.dataset.face as FaceFrame];
      gsap.to(face.querySelector("[data-mouth]"), {
        duration: spec.mouthSeconds ?? 0.35,
        ease: spec.mouthSeconds ? "sine.inOut" : "back.out(2)",
        fill: MOUTH_FILL[spec.mouth],
        morphSVG: mouthPath(geo.mouth, spec.mouth),
        overwrite: "auto",
      });
      gsap.to(face.querySelector("[data-tongue]"), {
        delay: spec.mouth === "yawn" ? 0.35 : 0,
        duration: 0.3,
        opacity: spec.mouth === "yawn" ? 1 : 0,
      });
      gsap.to(face.querySelector("[data-mouth-shine]"), {
        duration: 0.2,
        opacity: spec.mouth === "neutral" ? 0.7 : 0,
      });
      gsap.to(face.querySelectorAll("[data-blush]"), { duration: 0.45, opacity: spec.blush * 0.55 });

      face.querySelectorAll<SVGGElement>("[data-eye]").forEach((eye, index) => {
        const state = spec.eyes[index];
        gsap.to(eye.querySelector("[data-bead]"), {
          duration: 0.22,
          ease: "power2.out",
          overwrite: "auto",
          scaleY: state === "open" ? 1 : state === "sleepy" ? 0.4 : 0,
        });
        (Object.keys(EYE_MARKS) as (keyof typeof EYE_MARKS)[]).forEach((mark) => {
          gsap.to(eye.querySelector(EYE_MARKS[mark]), {
            duration: 0.25,
            ease: "back.out(3)",
            opacity: state === mark ? 1 : 0,
            scale: state === mark ? 1 : 0.4,
          });
        });
        gsap.to(eye, {
          duration: 0.3,
          ease: "back.out(3)",
          scale: spec.eyeScale ?? 1,
        });
      });
    });
  };

  const blink = () => {
    if (MOODS[mood].eyes.some((state) => state !== "open")) {
      return;
    }
    const beads = faces.flatMap((face) => Array.from(face.querySelectorAll("[data-bead]")));
    gsap
      .timeline()
      .to(beads, { duration: 0.07, ease: "power2.in", scaleY: 0.06 })
      .to(beads, { duration: 0.13, ease: "power2.out", scaleY: 1 });
  };

  const eyes = faces.flatMap((face) => Array.from(face.querySelectorAll("[data-eye]")));
  const glints = faces.flatMap((face) => Array.from(face.querySelectorAll("[data-glint]")));
  const eyeX = gsap.quickTo(eyes, "x", { duration: 0.35, ease: "power3.out" });
  const eyeY = gsap.quickTo(eyes, "y", { duration: 0.35, ease: "power3.out" });
  const glintX = gsap.quickTo(glints, "x", { duration: 0.35, ease: "power3.out" });
  const glintY = gsap.quickTo(glints, "y", { duration: 0.35, ease: "power3.out" });

  /** Point the eyes at x, y in [-1, 1] (local to the face, so pass mirrored x when flipped). */
  const look = (x: number, y: number) => {
    eyeX(x * 6);
    eyeY(y * 4);
    // Glints are lit from a fixed window, so they lag behind the eye.
    glintX(-x * 2.5);
    glintY(-y * 1.5);
  };

  // Slow breathing through a small open mouth while asleep.
  const mouths = faces.map((face) => face.querySelector("[data-mouth]"));
  let breath: gsap.core.Tween | null = null;
  const breathe = (on: boolean) => {
    breath?.kill();
    breath = on
      ? gsap.to(mouths, { duration: 1.8, ease: "sine.inOut", repeat: -1, scale: 1.35, yoyo: true })
      : null;
    if (!on) {
      gsap.to(mouths, { duration: 0.3, scale: 1 });
    }
  };

  return { blink, breathe, getMood: () => mood, look, setMood };
};
