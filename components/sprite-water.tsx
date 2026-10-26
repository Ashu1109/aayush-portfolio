import { SPRITE_HOP } from "@/components/sprite-brain";
import { gsap } from "gsap";
import Image from "next/image";
import { useId } from "react";

type Point = readonly [number, number];

/**
 * Water on each turnaround frame, in that frame's own pixels: the outer leaf
 * tips where drops gather and fall (clear of the body, so they never read as
 * tears), and the dew beads on the cap that catch light.
 */
export const WATER = {
  front: {
    glints: [[235, 70], [162, 82], [332, 105], [410, 145], [88, 70], [360, 78], [200, 150], [280, 125], [65, 130], [235, 25]],
    height: 428,
    tips: [[20, 205], [426, 203]],
    width: 441,
  },
  "three-quarter": {
    glints: [[190, 65], [232, 80], [110, 108], [305, 92], [355, 120], [390, 108], [158, 140], [270, 20], [65, 125], [335, 35]],
    height: 420,
    tips: [[13, 202], [412, 196]],
    width: 426,
  },
} satisfies Record<string, { glints: Point[]; height: number; tips: Point[]; width: number }>;

export type WaterFrame = keyof typeof WATER;

/** Specular glints over the cap's dew beads; they twinkle and drift with the light. */
export const SpriteGlints = ({ className, frame }: { className?: string; frame: WaterFrame }) => {
  const geo = WATER[frame];
  const glow = `glint-${useId().replace(/:/g, "")}`;
  return (
    <svg
      aria-hidden
      className={className}
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${geo.width} ${geo.height}`}
    >
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g data-glints>
        {geo.glints.map(([x, y]) => (
          <circle cx={x} cy={y} data-glint-dot fill={`url(#${glow})`} key={`${x}-${y}`} opacity="0" r="7" />
        ))}
      </g>
    </svg>
  );
};

/** Host-level layer for the falling drop, splash beads and ground ripples. */
export const WaterLayer = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0" data-water>
    <Image
      alt=""
      className="invisible absolute left-0 top-0 w-[5.5%]"
      data-drop
      height={65}
      src="/sprite/drop.webp"
      unoptimized
      width={76}
    />
    {Array.from({ length: 6 }, (_, index) => (
      <Image
        alt=""
        className="invisible absolute left-0 top-0 w-[3.2%]"
        data-spray
        height={65}
        key={`bead-${index}`}
        src="/sprite/drop.webp"
        unoptimized
        width={76}
      />
    ))}
    {[0, 1].map((index) => (
      <span
        className="invisible absolute left-0 top-0 h-[3.2%] w-[16%] rounded-[50%] border-[1.5px] border-[oklch(0.97_0.03_200/0.8)] shadow-[0_0_10px_oklch(0.97_0.03_200/0.35)]"
        data-ripple
        key={`ripple-${index}`}
      />
    ))}
  </div>
);

/** SVG filter that makes the dew cluster wobble and refract like liquid. */
export const DewFilter = ({ id }: { id: string }) => (
  <svg aria-hidden className="absolute size-0">
    <filter height="130%" id={id} width="130%" x="-15%" y="-15%">
      <feTurbulence
        baseFrequency="0.012 0.02"
        data-dew-turbulence
        numOctaves="2"
        result="noise"
        seed="4"
        type="fractalNoise"
      />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

// Gravity for falling water, in px/s^2 at this scale.
const GRAVITY = 2200;

/**
 * Makes the water behave: drops swell at a leaf tip, sag, fall with gravity
 * and splash (flattening, flicking beads, rippling the ground glow); hops
 * shake water off the cap; glints twinkle and slide as the light angle
 * changes; the dew cluster wobbles and jiggles on landing.
 *
 * Expects the WaterLayer, SpriteGlints and a filtered `[data-dew]` under
 * `host`, plus the turntable's `[data-bob]` and `[data-tilt]`. Create inside
 * a GSAP context; call the returned cleanup to drop the DOM listeners.
 */
export const createWater = (host: HTMLElement, canDrip: () => boolean) => {
  const drop = host.querySelector<HTMLElement>("[data-drop]");
  const beads = gsap.utils.toArray<HTMLElement>("[data-spray]", host);
  const ripples = gsap.utils.toArray<HTMLElement>("[data-ripple]", host);
  const bob = host.querySelector<HTMLElement>("[data-bob]");
  const tilt = host.querySelector<HTMLElement>("[data-tilt]");
  const dew = host.querySelector<HTMLElement>("[data-dew]");
  const turbulence = host.querySelector("[data-dew-turbulence]");
  if (!drop || !bob || !tilt) {
    return () => undefined;
  }

  const frame = (): WaterFrame =>
    host.dataset.frame === "three-quarter" ? "three-quarter" : "front";

  /** Frame pixel to host pixel, following the bob, lean and mirror. */
  const toHost = ([x, y]: Point) => {
    const geo = WATER[frame()];
    const scale = Math.min(host.clientWidth / geo.width, host.clientHeight / geo.height);
    const offsetX = (host.clientWidth - geo.width * scale) / 2;
    const offsetY = (host.clientHeight - geo.height * scale) / 2;
    const fx = host.dataset.flip === "true" ? geo.width - x : x;
    return {
      x: offsetX + fx * scale + Number(gsap.getProperty(tilt, "x")),
      y: offsetY + y * scale + Number(gsap.getProperty(bob, "y")),
    };
  };
  const ground = () => host.clientHeight * 0.985;

  /** Throw a bead from (x, y) in a ballistic arc that lands on the ground. */
  const flick = (bead: HTMLElement, x: number, y: number, spread: number, rise: number) => {
    const up = Math.sqrt((2 * rise) / GRAVITY);
    const down = Math.sqrt((2 * (ground() - y + rise)) / GRAVITY);
    gsap.killTweensOf(bead);
    gsap.set(bead, { autoAlpha: 1, scale: gsap.utils.random(0.45, 1), x, xPercent: -50, y, yPercent: -50 });
    gsap
      .timeline()
      .to(bead, { duration: up + down, ease: "none", x: x + gsap.utils.random(-spread, spread) }, 0)
      .to(bead, { duration: up, ease: "power2.out", y: y - rise }, 0)
      .to(bead, { duration: down, ease: "power2.in", y: ground() }, up)
      .to(bead, { autoAlpha: 0, duration: 0.12 }, up + down - 0.08);
  };

  const splash = (x: number) => {
    const y = ground();
    ripples.forEach((ring, index) =>
      gsap.fromTo(
        ring,
        { autoAlpha: 0.85, scale: 0.15, x, xPercent: -50, y, yPercent: -50 },
        { autoAlpha: 0, delay: index * 0.12, duration: 0.9 + index * 0.35, ease: "power2.out", scale: 1.5 + index * 0.6 }
      )
    );
    beads.slice(0, 4).forEach((bead) => flick(bead, x, y - 2, 34, gsap.utils.random(16, 42)));
  };

  let forming: gsap.core.Timeline | null = null;
  let falling: gsap.core.Timeline | null = null;

  const release = () => {
    forming?.kill();
    const x = Number(gsap.getProperty(drop, "x"));
    const y = Number(gsap.getProperty(drop, "y"));
    const fall = Math.max(0.18, Math.sqrt((2 * Math.max(0, ground() - y)) / GRAVITY));
    falling = gsap
      .timeline()
      // Falling water stretches into a teardrop, then flattens on impact.
      .to(drop, { duration: fall, ease: "power2.in", scaleX: 0.72, scaleY: 1.5, y: ground() - drop.offsetHeight * 0.6 })
      .add(() => splash(x))
      .to(drop, { autoAlpha: 0, duration: 0.1, ease: "power1.out", scaleX: 1.9, scaleY: 0.25 });
  };

  const drip = () => {
    if (!canDrip() || forming?.isActive() || falling?.isActive()) {
      return;
    }
    const tip = gsap.utils.random(WATER[frame()].tips as Point[]);
    const follow = () => {
      const at = toHost(tip);
      gsap.set(drop, { x: at.x, y: at.y });
    };
    gsap.set(drop, { autoAlpha: 1, scaleX: 0, scaleY: 0, transformOrigin: "50% 0%", xPercent: -50, yPercent: -12 });
    follow();
    forming = gsap
      .timeline({ onComplete: release })
      // Gathers at the tip, then sags under its own weight before letting go.
      .to(drop, { duration: 1.8, ease: "power1.inOut", onUpdate: follow, scaleX: 1, scaleY: 1 })
      .to(drop, { duration: 0.55, ease: "sine.inOut", onUpdate: follow, scaleX: 0.86, scaleY: 1.32 });
  };

  const scheduleDrip = (): gsap.core.Tween =>
    gsap.delayedCall(gsap.utils.random(2.6, 5.8), () => {
      drip();
      scheduleDrip();
    });
  scheduleDrip();

  // A hop shakes water off: any gathering drop lets go, beads spray off the
  // cap, and the dew cluster jiggles.
  const onHop = () => {
    if (forming?.isActive()) {
      release();
    }
    const glints = WATER[frame()].glints;
    beads.forEach((bead) => {
      const from = toHost(gsap.utils.random(glints as Point[]));
      flick(bead, from.x, from.y, 130, gsap.utils.random(40, 110));
    });
    if (dew) {
      gsap.fromTo(
        dew,
        { scaleX: 1.14, scaleY: 0.84 },
        { delay: 0.5, duration: 1, ease: "elastic.out(1, 0.3)", scaleX: 1, scaleY: 1 }
      );
    }
  };

  // Glints: each bead flares now and then, and the whole set slides against
  // the cursor because a fixed light reflects off a moving viewpoint.
  gsap.utils.toArray<SVGCircleElement>("[data-glint-dot]", host).forEach((dot) => {
    gsap.set(dot, { svgOrigin: `${dot.getAttribute("cx")} ${dot.getAttribute("cy")}` });
    gsap.to(dot, {
      delay: gsap.utils.random(0, 4),
      duration: gsap.utils.random(0.5, 1.1),
      ease: "sine.inOut",
      keyframes: { opacity: [0, 0.95, 0], scale: [0.4, 1.15, 0.4] },
      repeat: -1,
      repeatDelay: gsap.utils.random(1.5, 5),
    });
  });
  const glintGroups = gsap.utils.toArray<SVGGElement>("[data-glints]", host);
  const glintX = gsap.quickTo(glintGroups, "x", { duration: 0.6, ease: "power3.out" });
  const glintY = gsap.quickTo(glintGroups, "y", { duration: 0.6, ease: "power3.out" });
  const onPointerMove = (event: PointerEvent) => {
    glintX(-((event.clientX / window.innerWidth) * 2 - 1) * 5);
    glintY(-((event.clientY / window.innerHeight) * 2 - 1) * 4);
  };

  // The dew cluster's refraction drifts slowly, like liquid that never settles.
  if (turbulence) {
    gsap.to(turbulence, {
      attr: { baseFrequency: "0.017 0.028" },
      duration: 3.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }

  host.addEventListener(SPRITE_HOP, onHop);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  return () => {
    host.removeEventListener(SPRITE_HOP, onHop);
    window.removeEventListener("pointermove", onPointerMove);
  };
};
