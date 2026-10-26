"use client";

import { useGSAP } from "@gsap/react";
import { createSpriteBrain } from "@/components/sprite-brain";
import { SpriteFace } from "@/components/sprite-face";
import { createWater, DewFilter, SpriteGlints, WaterLayer } from "@/components/sprite-water";
import { gsap } from "gsap";
import { HeartIcon } from "lucide-react";
import Image from "next/image";
import { useId, useRef } from "react";

gsap.registerPlugin(useGSAP);

// Turnaround frames cut from the character sheet. Native facing: the side
// frame looks right, the three-quarter frame looks slightly left. Front and
// three-quarter use faceless art with a live SpriteFace on top. `show` and
// `mask` are literal classes so Tailwind can see them; the mask reuses the
// frame file so the sheen only lands on the sprite's body.
const FRAMES = [
  {
    face: true,
    file: "front-faceless",
    height: 428,
    mask: "group-data-[frame=front]/sprite:[mask-image:url(/sprite/front-faceless.webp)]",
    name: "front",
    show: "group-data-[frame=front]/sprite:opacity-100",
    width: 441,
  },
  {
    face: true,
    file: "three-quarter-faceless",
    height: 420,
    mask: "group-data-[frame=three-quarter]/sprite:[mask-image:url(/sprite/three-quarter-faceless.webp)]",
    name: "three-quarter",
    show: "group-data-[frame=three-quarter]/sprite:opacity-100",
    width: 426,
  },
  {
    face: false,
    file: "side",
    height: 426,
    mask: "group-data-[frame=side]/sprite:[mask-image:url(/sprite/side.webp)]",
    name: "side",
    show: "group-data-[frame=side]/sprite:opacity-100",
    width: 391,
  },
  {
    face: false,
    file: "back",
    height: 424,
    mask: "group-data-[frame=back]/sprite:[mask-image:url(/sprite/back.webp)]",
    name: "back",
    show: "group-data-[frame=back]/sprite:opacity-100",
    width: 430,
  },
] as const;

type Frame = (typeof FRAMES)[number]["name"];

// Facing angle in degrees: 0 faces the viewer, 90 is profile-right, 180 is
// the back. Each segment maps to a frame (mirrored where needed). There is no
// back three-quarter art, so the back frame covers a wider arc.
const SEGMENTS: { center: number; flip: boolean; frame: Frame; half: number }[] = [
  { center: 0, flip: false, frame: "front", half: 22.5 },
  { center: 45, flip: true, frame: "three-quarter", half: 22.5 },
  { center: 90, flip: false, frame: "side", half: 22.5 },
  { center: 180, flip: false, frame: "back", half: 67.5 },
  { center: 270, flip: true, frame: "side", half: 22.5 },
  { center: 315, flip: false, frame: "three-quarter", half: 22.5 },
  { center: 360, flip: false, frame: "front", half: 22.5 },
];

/** Frame, mirror, and leftover twist (deg) that fake an in-between angle. */
export const frameForAngle = (angle: number) => {
  const a = ((angle % 360) + 360) % 360;
  const segment = SEGMENTS.find((s) => Math.abs(a - s.center) <= s.half) ?? SEGMENTS[0];
  return {
    flip: segment.flip,
    frame: segment.frame,
    twist: gsap.utils.clamp(-14, 14, (a - segment.center) * 0.6),
  };
};

/** Mutable turn state a parent timeline tweens; the sprite renders it. */
export type Turn = { angle: number };

// How far (deg) the cursor can turn the sprite. Kept inside the
// three-quarter arc so the animated face stays visible; the eyes do the rest.
const LOOK_REACH = 55;

/**
 * The leaf sprite as a turntable: 2D turnaround frames made to read as a 3D
 * object. A parent drives `turn.angle` (scroll); on top of that the cursor
 * adds a look-around (only while the turn is near 0), a perspective tilt, a
 * sheen that slides as the light angle changes, dewdrops on a nearer depth
 * plane, and a glow pool it bobs above. A live face and behaviour layer
 * (sprite-brain) make it blink, emote, and react to pokes. Static front view
 * under reduced motion.
 */
export const SpriteTurntable = ({ turn }: { turn: Turn }) => {
  const scope = useRef<HTMLDivElement>(null);
  const dewFilter = `dew-${useId().replace(/:/g, "")}`;

  useGSAP(
    () => {
      const host = scope.current;
      const spin = host?.querySelector<HTMLElement>("[data-spin]");
      const sheen = host?.querySelector<HTMLElement>("[data-sheen]");
      if (!host || !spin || !sheen) {
        return;
      }
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const float = { duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true };
        // Rise with a slight stretch; the glow pool shrinks and dims in sync.
        gsap.to("[data-bob]", {
          ...float,
          scaleX: 0.985,
          scaleY: 1.025,
          transformOrigin: "50% 100%",
          y: -16,
        });
        gsap.to("[data-pool]", { ...float, opacity: 0.45, scale: 0.78 });
        gsap.set("[data-dew]", { z: 90 });
        gsap.to("[data-dew]", { ...float, duration: 3.1, y: -12 });

        const look = { x: 0, y: 0 };
        const lookX = gsap.quickTo(look, "x", { duration: 0.8, ease: "power3.out" });
        const lookY = gsap.quickTo(look, "y", { duration: 0.8, ease: "power3.out" });
        const lean = gsap.quickTo("[data-tilt]", "x", { duration: 0.8, ease: "power3.out" });

        const onPointerMove = (event: PointerEvent) => {
          const rect = host.getBoundingClientRect();
          const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth * 0.35);
          const y = (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight * 0.5);
          lookX(gsap.utils.clamp(-1, 1, x));
          lookY(gsap.utils.clamp(-1, 1, y));
          lean(gsap.utils.clamp(-1, 1, x) * 12);
        };

        const setSpinY = gsap.quickSetter(spin, "rotationY", "deg");
        const setSpinX = gsap.quickSetter(spin, "rotationX", "deg");
        const setSheenX = gsap.quickSetter(sheen, "xPercent");
        const setSheenY = gsap.quickSetter(sheen, "yPercent");
        let shown = "front:false";

        const render = () => {
          // The cursor look fades out once the scroll-driven turn takes over.
          const weight = 1 - gsap.utils.clamp(0, 1, Math.abs(turn.angle) / 45);
          const { flip, frame, twist } = frameForAngle(turn.angle + look.x * LOOK_REACH * weight);
          const key = `${frame}:${flip}`;
          if (key !== shown) {
            shown = key;
            host.dataset.frame = frame;
            host.dataset.flip = String(flip);
            // Squeeze through the swap so the frame change reads as a turn.
            gsap.fromTo(
              "[data-turn]",
              { scaleX: 0.86 },
              { duration: 0.45, ease: "back.out(2.5)", overwrite: true, scaleX: 1 }
            );
          }
          // Positive rotationY swings the face toward the viewer's right.
          setSpinY(twist);
          setSpinX(-look.y * 10);
          // Fixed light, turning body: the highlight slides the other way.
          // The sheen sits inside the mirrored layer, so undo the mirror.
          setSheenX(-twist * 3 * (flip ? -1 : 1));
          setSheenY(look.y * 30);
        };

        gsap.ticker.add(render);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        const stopBrain = createSpriteBrain(host, () => host.dataset.flip === "true");
        // Drips only while it faces you at rest; turning frames have other tips.
        const stopWater = createWater(
          host,
          () => Math.abs(turn.angle) < 4 && (host.dataset.frame === "front" || host.dataset.frame === "three-quarter")
        );
        return () => {
          stopBrain();
          stopWater();
          gsap.ticker.remove(render);
          window.removeEventListener("pointermove", onPointerMove);
        };
      });
    },
    { scope }
  );

  return (
    <div
      className="group/sprite relative mx-auto aspect-[441/428] w-full"
      data-flip="false"
      data-frame="front"
      ref={scope}
    >
      {/* Lantern glow behind, and the light pool it casts on the ground. */}
      <div className="absolute -inset-[30%] rounded-full bg-[radial-gradient(closest-side,oklch(0.94_0.07_105/0.16),transparent)]" />
      <div
        className="absolute -bottom-[7%] left-[12%] h-[16%] w-[76%] rounded-full bg-[radial-gradient(closest-side,oklch(0.94_0.07_105/0.3),transparent)]"
        data-pool
      />
      {/* Perspective sits on the 3D layers' direct parent so it isn't flattened. */}
      <div className="absolute inset-0 [perspective:900px]" data-bob>
        <div className="absolute inset-0 [transform-style:preserve-3d]" data-tilt>
          <div className="absolute inset-0 [transform-style:preserve-3d]" data-spin>
            <div className="absolute inset-0" data-gesture style={{ transformOrigin: "50% 100%" }}>
            <div className="absolute inset-0" data-turn style={{ transformOrigin: "50% 100%" }}>
              <div className="absolute inset-0 group-data-[flip=true]/sprite:-scale-x-100">
                {FRAMES.map((frame) => (
                  <Image
                    alt=""
                    className={`absolute inset-0 h-full w-full object-contain opacity-0 ${frame.show}`}
                    height={frame.height}
                    key={frame.name}
                    loading="eager"
                    src={`/sprite/${frame.file}.webp`}
                    unoptimized
                    width={frame.width}
                  />
                ))}
                {FRAMES.filter((frame) => frame.face).map((frame) => (
                  <SpriteFace
                    className={`absolute inset-0 h-full w-full opacity-0 ${frame.show}`}
                    frame={frame.name as "front" | "three-quarter"}
                    key={frame.name}
                  />
                ))}
                {FRAMES.filter((frame) => frame.face).map((frame) => (
                  <SpriteGlints
                    className={`pointer-events-none absolute inset-0 h-full w-full opacity-0 ${frame.show}`}
                    frame={frame.name as "front" | "three-quarter"}
                    key={`glints-${frame.name}`}
                  />
                ))}
                <div
                  className={`absolute inset-0 overflow-hidden mix-blend-screen [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${FRAMES.map((frame) => frame.mask).join(" ")}`}
                >
                  <div
                    className="absolute left-[8%] top-[4%] h-[60%] w-[60%] rounded-full bg-[radial-gradient(closest-side,oklch(1_0.02_105/0.42),transparent)]"
                    data-sheen
                  />
                </div>
              </div>
            </div>
            </div>
            <Image
              alt=""
              className="absolute -bottom-[4%] -left-[14%] w-[26%]"
              data-dew
              height={242}
              src="/sprite/dew.webp"
              style={{ filter: `url(#${dewFilter})` }}
              unoptimized
              width={333}
            />
          </div>
        </div>
      </div>

      <DewFilter id={dewFilter} />
      <WaterLayer />

      {/* Reaction particles: hearts on a loving poke, z's while it dozes. */}
      <div aria-hidden className="pointer-events-none absolute right-[16%] top-[6%]">
        {[0, 1, 2].map((index) => (
          <HeartIcon
            className="invisible absolute size-5 fill-[#ff5c7a] text-[#ff5c7a]"
            data-fx-heart
            key={`heart-${index}`}
          />
        ))}
        {["text-lg", "text-2xl", "text-3xl"].map((size) => (
          <span
            className={`invisible absolute font-heading font-bold text-moss-100 ${size}`}
            data-fx-zee
            key={size}
          >
            z
          </span>
        ))}
      </div>

      {/* Body-sized poke target; hover makes it happy, each poke a new reaction. */}
      <button
        aria-label="Poke the sprite"
        className="absolute inset-x-[16%] bottom-[4%] top-[8%] cursor-pointer rounded-[45%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf-400"
        data-poke
        type="button"
      />
    </div>
  );
};
