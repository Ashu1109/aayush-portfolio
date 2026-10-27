"use client";

import { useGSAP } from "@gsap/react";
import { createSpriteBrain } from "@/components/sprite-brain";
import { FACES, type FaceFrame, SpriteFace } from "@/components/sprite-face";
import { createRelief, RELIEF_DEPTH, type Relief } from "@/components/sprite-relief";
import { createWater, DewFilter, WaterLayer } from "@/components/sprite-water";
import { gsap } from "gsap";
import { HeartIcon } from "lucide-react";
import Image from "next/image";
import { useId, useRef } from "react";

gsap.registerPlugin(useGSAP);

// Turnaround frames cut from the character sheet. Native facing: the side
// frame looks right, the three-quarter frame looks slightly left. Front and
// three-quarter use faceless art with a live SpriteFace on top. `show` is a
// literal class so Tailwind can see it.
const FRAMES = [
  {
    face: true,
    file: "front-faceless",
    height: 428,
    name: "front",
    show: "group-data-[frame=front]/sprite:opacity-100",
    width: 441,
  },
  {
    face: true,
    file: "three-quarter-faceless",
    height: 420,
    name: "three-quarter",
    show: "group-data-[frame=three-quarter]/sprite:opacity-100",
    width: 426,
  },
  {
    face: false,
    file: "side",
    height: 426,
    name: "side",
    show: "group-data-[frame=side]/sprite:opacity-100",
    width: 391,
  },
  {
    face: false,
    file: "back",
    height: 424,
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
const RAD = Math.PI / 180;

/**
 * The leaf sprite as a turntable, rendered as real 3D: each frame's art is
 * inflated into a relief mesh (sprite-relief) that turns with the cursor and
 * the scroll, keeping the painted texture exactly as rendered while the
 * turned-away side dims and the dew beads glint as the light moves. Frames
 * swap at the segment edges to cover the full turn.
 * The live face rides a CSS 3D plane matched to the mesh's camera and depth;
 * a behaviour layer (sprite-brain) makes it blink, emote and react to pokes.
 * Without WebGL it falls back to the flat frames; reduced motion gets a
 * still, lit front view.
 */
export const SpriteTurntable = ({ turn }: { turn: Turn }) => {
  const scope = useRef<HTMLDivElement>(null);
  const dewFilter = `dew-${useId().replace(/:/g, "")}`;

  useGSAP(
    () => {
      const host = scope.current;
      const canvas = host?.querySelector<HTMLCanvasElement>("canvas[data-relief]");
      const plane = host?.querySelector<HTMLElement>("[data-face-plane]");
      const dew = host?.querySelector<HTMLElement>("[data-dew]");
      if (!host || !canvas || !plane || !dew) {
        return;
      }

      let relief: Relief | null = null;
      try {
        relief = createRelief(canvas, FRAMES);
      } catch {
        // No WebGL: the flat frames stay on screen.
      }

      // The relief camera is orthographic, so the face plane needs no CSS
      // perspective: rotate + translateZ alone project it the same way.
      let stageHeight = host.clientHeight;
      const fit = () => {
        stageHeight = host.clientHeight;
        relief?.resize(host.clientWidth, stageHeight);
      };
      const resizeObserver = new ResizeObserver(fit);
      resizeObserver.observe(host);
      fit();

      const pose = { lightX: 0, lightY: 0, pitch: 0, yaw: 0 };
      let faceHeight = 0;

      const showFrame = (frame: string, flip: boolean) => {
        relief?.setFrame(frame, flip);
        const face = FACES[frame as FaceFrame];
        faceHeight =
          face && relief
            ? relief.heightAt(frame, (face.eyes[0].cx + face.eyes[1].cx) / 2, (face.eyes[0].cy + face.mouth.cy) / 2)
            : 0;
      };

      const draw = () => {
        if (!relief || host.dataset.gl !== "on") {
          return;
        }
        relief.setPose(pose.yaw, pose.pitch);
        relief.setLight(pose.lightX, pose.lightY);
        relief.render();
        const depth = (faceHeight * RELIEF_DEPTH * stageHeight) / 2;
        plane.style.transform = `rotateX(${-pose.pitch}rad) rotateY(${pose.yaw}rad) translateZ(${depth}px)`;
      };

      let disposed = false;
      relief?.ready
        .then(() => {
          if (disposed) {
            return;
          }
          showFrame(host.dataset.frame ?? "front", host.dataset.flip === "true");
          host.dataset.gl = "on";
          draw();
        })
        .catch(() => {
          // Textures failed: keep the flat frames.
        });

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
        gsap.to(dew, { ...float, duration: 3.1, y: -12 });

        const look = { x: 0, y: 0 };
        const lookX = gsap.quickTo(look, "x", { duration: 0.8, ease: "power3.out" });
        const lookY = gsap.quickTo(look, "y", { duration: 0.8, ease: "power3.out" });
        const lean = gsap.quickTo("[data-tilt]", "x", { duration: 0.8, ease: "power3.out" });
        const setDewX = gsap.quickSetter(dew, "x", "px");

        const onPointerMove = (event: PointerEvent) => {
          const rect = host.getBoundingClientRect();
          const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth * 0.35);
          const y = (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight * 0.5);
          lookX(gsap.utils.clamp(-1, 1, x));
          lookY(gsap.utils.clamp(-1, 1, y));
          lean(gsap.utils.clamp(-1, 1, x) * 12);
        };

        // Only spend GPU time while the sprite is on screen.
        let onScreen = true;
        const visibility = new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting;
        });
        visibility.observe(host);

        let shown = "";
        const render = (time: number) => {
          // The cursor look fades out once the scroll-driven turn takes over.
          const weight = 1 - gsap.utils.clamp(0, 1, Math.abs(turn.angle) / 45);
          const { flip, frame, twist } = frameForAngle(turn.angle + look.x * LOOK_REACH * weight);
          const key = `${frame}:${flip}`;
          if (key !== shown) {
            if (shown) {
              // Squeeze through the swap so the frame change reads as a turn.
              gsap.fromTo(
                "[data-turn]",
                { scaleX: 0.86 },
                { duration: 0.45, ease: "back.out(2.5)", overwrite: true, scaleX: 1 }
              );
            }
            shown = key;
            host.dataset.frame = frame;
            host.dataset.flip = String(flip);
            showFrame(frame, flip);
          }
          // A slow idle sway keeps the volume reading even when nothing moves.
          pose.yaw = (twist * 1.25 + Math.sin(time * 0.7) * 2.5) * RAD;
          pose.pitch = look.y * 10 * RAD;
          pose.lightX = look.x;
          pose.lightY = look.y;
          host.dataset.yaw = pose.yaw.toFixed(4);
          // The dew sits in front of the body, so it swings wider as it turns.
          setDewX(Math.sin(pose.yaw) * stageHeight * 0.18);
          if (onScreen) {
            draw();
          }
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
          visibility.disconnect();
          gsap.ticker.remove(render);
          window.removeEventListener("pointermove", onPointerMove);
        };
      });

      return () => {
        disposed = true;
        resizeObserver.disconnect();
        relief?.dispose();
      };
    },
    { scope }
  );

  return (
    <div
      className="group/sprite relative mx-auto aspect-[441/428] w-full"
      data-flip="false"
      data-frame="front"
      data-gl="off"
      ref={scope}
    >
      {/* Lantern glow behind, and the light pool it casts on the ground. */}
      <div className="absolute -inset-[30%] rounded-full bg-[radial-gradient(closest-side,oklch(0.94_0.07_105/0.16),transparent)]" />
      <div
        className="absolute -bottom-[7%] left-[12%] h-[16%] w-[76%] rounded-full bg-[radial-gradient(closest-side,oklch(0.94_0.07_105/0.3),transparent)]"
        data-pool
      />
      <div className="absolute inset-0" data-bob>
        <div className="absolute inset-0" data-tilt>
          <div className="absolute inset-0" data-gesture style={{ transformOrigin: "50% 100%" }}>
            <div className="absolute inset-0" data-turn style={{ transformOrigin: "50% 100%" }}>
              {/* Flat frames: on screen until the relief is ready, and the no-WebGL fallback. */}
              <div className="absolute inset-0 group-data-[flip=true]/sprite:-scale-x-100 group-data-[gl=on]/sprite:invisible">
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
              </div>
              <canvas
                aria-hidden
                className="absolute inset-0 h-full w-full group-data-[gl=off]/sprite:invisible"
                data-relief
              />
              {/* The face rides a CSS plane projected exactly like the relief mesh. */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0" data-face-plane>
                  <div className="absolute inset-0 group-data-[flip=true]/sprite:-scale-x-100">
                    {FRAMES.filter((frame) => frame.face).map((frame) => (
                      <SpriteFace
                        className={`absolute inset-0 h-full w-full opacity-0 ${frame.show}`}
                        frame={frame.name as FaceFrame}
                        key={frame.name}
                      />
                    ))}
                  </div>
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
