"use client";

import { SpriteTurntable, type Turn } from "@/components/sprite";
import { Loader } from "@/components/stage/loader";
import { CONTACT } from "@/lib/resume";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Image from "next/image";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const [firstName, lastName] = CONTACT.name.split(" ");

type Scene = {
  body: string;
  heading: string;
  label?: string;
  layout: "left" | "center" | "right";
};

// Story copy is presentation only, but every claim comes from lib/resume.ts.
const SCENES: Scene[] = [
  {
    body: "FilmOS, LoglineAI's film-production platform, from web app to Tauri desktop. 500 people use it every day, and it saves Rs. 7L+ a month.",
    heading: "Built it. Own it.",
    layout: "left",
  },
  {
    body: "p50 generation latency cut 20x for a 14-agent Claude and Gemini pipeline, by splitting Temporal work per image.",
    heading: "Ten minutes to thirty seconds.",
    label: "LoglineOS",
    layout: "center",
  },
  {
    body: "OpenTelemetry into SigNoz on every service, AWS WAF in front of production, and all 8 P0 security findings closed.",
    heading: "Shipped and secured.",
    layout: "right",
  },
];

// The sprite faces the scene's body copy: right, away, then left.
const SCENE_ANGLES = [90, 180, 270];

const SCENE_LAYOUT = {
  center: "flex flex-col items-center justify-between px-6 pb-[9dvh] pt-[11dvh] text-center lg:px-[4vw]",
  left: "flex flex-col justify-between px-6 pb-[9dvh] pt-[16dvh] lg:grid lg:grid-cols-[1fr_min(34vw,480px)_1fr] lg:items-center lg:gap-12 lg:px-[4vw] lg:py-0",
  right: "flex flex-col justify-between px-6 pb-[9dvh] pt-[16dvh] lg:grid lg:grid-cols-[1fr_min(34vw,480px)_1fr] lg:items-center lg:gap-12 lg:px-[4vw] lg:py-0",
} as const;

const SceneBlock = ({ scene }: { scene: Scene }) => {
  const heading =
    scene.layout === "center"
      ? "text-[clamp(2.25rem,4.6vw,5rem)] font-semibold leading-[1] tracking-tight"
      : "text-[clamp(2.25rem,4.4vw,4.75rem)] font-bold uppercase leading-[0.95] tracking-tight";
  const order = scene.layout === "right" ? "lg:col-start-3 lg:row-start-1" : "lg:col-start-1";
  const bodyOrder =
    scene.layout === "right"
      ? "lg:col-start-1 lg:row-start-1"
      : scene.layout === "left"
        ? "lg:col-start-3 lg:justify-self-end"
        : "self-end text-right";

  return (
    // z-20: copy always reads over the sprite; clicks pass through to poke it.
    <div className={`pointer-events-none relative z-20 min-h-[80dvh] ${SCENE_LAYOUT[scene.layout]}`} data-scene>
      <div className={order}>
        {scene.label ? (
          <p
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-leaf-400"
            data-label
          >
            {scene.label}
          </p>
        ) : null}
        <h2
          className={`text-moss-50 ${scene.layout === "center" ? "" : "max-w-[14ch]"} ${heading}`}
          data-heading
        >
          {scene.heading}
        </h2>
      </div>
      <p
        className={`max-w-[21rem] text-[15px] leading-relaxed text-moss-300 ${bodyOrder}`}
        data-body
      >
        {scene.body}
      </p>
    </div>
  );
};

/**
 * Opening act, staged like a product launch: the sprite is the one object on
 * stage. The name sits huge behind it; scrolling turns it a full 360 while
 * three claims resolve around it, then it flies into the corner and hands off
 * to the docked companion. Without motion, everything renders as stacked
 * static blocks and the GSAP layer never attaches.
 */
export const Story = () => {
  const scope = useRef<HTMLElement>(null);
  const introRef = useRef<() => void>(() => undefined);
  const [turn] = useState<Turn>(() => ({ angle: 0 }));

  useGSAP(
    () => {
      const root = scope.current;
      const pin = root?.querySelector<HTMLElement>("[data-pin]");
      const dock = root?.querySelector<HTMLElement>("[data-dock]");
      if (!root || !pin || !dock) {
        return;
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", (_context, contextSafe) => {
        // Played by the loader as it dissolves; contextSafe so it reverts with the rest.
        introRef.current = contextSafe!(() => {
          gsap
            .timeline()
            .from("[data-name-rise]", { duration: 1.3, ease: "power4.out", stagger: 0.12, yPercent: 105 })
            .from(
              "[data-intro]",
              { autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, y: 18 },
              0.35
            );
        }) as () => void;

        const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]", root);
        gsap.set(pin, { height: "100dvh", overflow: "hidden" });
        gsap.set(scenes, { inset: 0, minHeight: 0, position: "absolute" });

        const headings = scenes.map((scene) =>
          SplitText.create(scene.querySelector("[data-heading]"), { type: "words,chars" })
        );
        const bodies = scenes.map((scene) =>
          SplitText.create(scene.querySelector("[data-body]"), { type: "words" })
        );

        // Where the docked companion sits, relative to the stage sprite's
        // untransformed box (the stage fills the viewport while pinned).
        const dockShift = () => {
          const target = document.querySelector("[data-companion]")?.getBoundingClientRect();
          if (!target) {
            return { scale: 1, x: 0, y: 0 };
          }
          return {
            scale: target.width / dock.offsetWidth,
            x: target.left + target.width / 2 - (dock.offsetLeft + dock.offsetWidth / 2),
            y: target.top + target.height / 2 - (dock.offsetTop + dock.offsetHeight / 2),
          };
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            end: "+=600%",
            invalidateOnRefresh: true,
            // Hand the sprite to the fixed companion the instant the pin ends.
            onEnterBack: () => gsap.set(dock, { autoAlpha: 1 }),
            onLeave: () => gsap.set(dock, { autoAlpha: 0 }),
            pin,
            scrub: true,
            start: "top top",
            trigger: pin,
          },
        });

        const turnTo = (angle: number, at: number) =>
          tl.to(turn, { angle, duration: 1.2, ease: "power1.inOut" }, at);

        const enter = (index: number, at: number) => {
          tl.fromTo(
            headings[index].chars,
            { autoAlpha: 0, filter: "blur(12px)", yPercent: 35 },
            { autoAlpha: 1, duration: 0.5, ease: "power2.out", filter: "blur(0px)", stagger: 0.015, yPercent: 0 },
            at
          ).fromTo(
            bodies[index].words,
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, duration: 0.4, ease: "power2.out", stagger: 0.012, y: 0 },
            at + 0.3
          );
          const label = scenes[index].querySelector("[data-label]");
          if (label) {
            tl.fromTo(label, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, at + 0.4);
          }
        };

        const leave = (index: number, at: number) =>
          tl.to(
            scenes[index],
            { autoAlpha: 0, duration: 0.5, ease: "power1.in", filter: "blur(8px)", y: -50 },
            at
          );

        // Act one: the name dissolves as the sprite turns to face the copy.
        tl.to(
          "[data-name-line]",
          { autoAlpha: 0, duration: 0.9, ease: "power1.in", filter: "blur(14px)", stagger: 0.12, yPercent: -30 },
          0.05
        ).to("[data-hero-copy]", { autoAlpha: 0, duration: 0.5, y: -24 }, 0);

        SCENE_ANGLES.forEach((angle, index) => {
          const start = index * 2.4;
          turnTo(angle, start);
          enter(index, start + 0.8);
          leave(index, start + 2.4);
        });

        // A leaf drifts past the lens on the way round, and the key light swaps sides.
        tl.fromTo(
          "[data-leaf]",
          {
            autoAlpha: 1,
            rotation: -40,
            x: () => -window.innerWidth * 0.5,
            y: () => window.innerHeight * 0.15,
          },
          {
            duration: 1.4,
            ease: "power1.inOut",
            rotation: 60,
            x: () => window.innerWidth * 1.1,
            y: () => -window.innerHeight * 0.2,
          },
          2.3
        )
          .to("[data-light=a]", { autoAlpha: 0.25, duration: 1.2 }, 2.4)
          .to("[data-light=b]", { autoAlpha: 1, duration: 1.2 }, 2.4)
          .to("[data-light=a]", { autoAlpha: 1, duration: 1 }, 7.2)
          .to("[data-light=b]", { autoAlpha: 0, duration: 1 }, 7.2);

        // Finale: turn back to face the viewer, then fly into the corner.
        turnTo(360, 7.2);
        tl.to(
          dock,
          {
            duration: 0.9,
            ease: "power2.inOut",
            scale: () => dockShift().scale,
            x: () => dockShift().x,
            y: () => dockShift().y,
          },
          7.5
        ).fromTo(
          "[data-outro]",
          { autoAlpha: 0, filter: "blur(12px)", y: 30 },
          { autoAlpha: 1, duration: 0.6, ease: "power2.out", filter: "blur(0px)", y: 0 },
          7.8
        );
      });
    },
    { scope }
  );

  return (
    <section className="relative" id="hero" ref={scope}>
      <Loader onDone={() => introRef.current()} />
      <div className="relative" data-pin>
        <div className="relative h-[100dvh] overflow-hidden">
          {/* Key light: a soft wash from one corner that swaps sides mid-story. */}
          <div
            className="absolute inset-0 bg-[radial-gradient(55%_60%_at_0%_100%,oklch(0.8_0.12_130/0.16),transparent)]"
            data-light="a"
          />
          <div
            className="invisible absolute inset-0 bg-[radial-gradient(55%_60%_at_100%_0%,oklch(0.94_0.07_105/0.14),transparent)]"
            data-light="b"
          />

          <h1 className="select-none font-bold leading-[0.82] tracking-tight">
            <span
              className="absolute left-6 top-[13dvh] block lg:left-[4vw] lg:top-[9vh]"
              data-name-line
            >
              <span className="block overflow-hidden pb-[0.12em]">
                <span
                  className="block text-[clamp(4.5rem,21vw,18rem)] text-moss-100 lg:text-[17vw]"
                  data-name-rise
                >
                  {firstName}
                </span>
              </span>
            </span>
            <span
              className="absolute bottom-[27dvh] right-6 block lg:bottom-[5vh] lg:right-[4vw]"
              data-name-line
            >
              <span className="block overflow-hidden pb-[0.12em]">
                <span
                  className="block text-[clamp(4.5rem,21vw,18rem)] text-leaf-400 lg:text-[17vw]"
                  data-name-rise
                >
                  {lastName}
                </span>
              </span>
            </span>
          </h1>

          {/* Centered without transforms so the dock maths can use offset boxes. */}
          <div
            className="absolute inset-0 z-10 m-auto aspect-[441/428] w-[min(62vw,30dvh)] lg:w-[min(34vw,480px,52dvh)]"
            data-dock
          >
            <SpriteTurntable turn={turn} />
          </div>

          <div
            className="absolute bottom-[8dvh] left-6 z-20 max-w-[58%] lg:bottom-[7vh] lg:left-[4vw] lg:max-w-[19rem]"
            data-hero-copy
          >
            <p
              className="font-mono text-[11px] uppercase tracking-[0.3em] text-leaf-400"
              data-intro
            >
              Full stack AI engineer at LoglineAI
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-moss-300" data-intro>
              I build event-driven platforms that keep multi-agent systems honest.
            </p>
          </div>
          <div
            className="absolute bottom-[8dvh] right-6 z-20 lg:bottom-auto lg:right-[4vw] lg:top-[13vh]"
            data-hero-copy
          >
            <a
              className="inline-block rounded-full bg-leaf-400 px-6 py-3 text-sm font-semibold text-moss-950 transition-transform hover:bg-leaf-300 active:scale-[0.98]"
              data-intro
              href="#contact"
            >
              Let&apos;s talk
            </a>
          </div>

          {/* Foreground leaf, defocused like it's right in front of the lens. */}
          <Image
            alt=""
            aria-hidden
            className="pointer-events-none invisible absolute left-0 top-[30%] z-30 w-[38vw] blur-[6px]"
            data-leaf
            height={280}
            src="/sprite/leaf.webp"
            unoptimized
            width={314}
          />

          {/* Closing line, so the emptied stage scrolls away with a hand-off. */}
          <p
            className="pointer-events-none invisible absolute inset-x-6 top-[38dvh] z-20 text-center font-heading text-[clamp(2.25rem,5vw,5rem)] font-semibold tracking-tight text-moss-100 lg:top-[42vh]"
            data-outro
          >
            The work, in order.
          </p>
        </div>

        {SCENES.map((scene) => (
          <SceneBlock key={scene.heading} scene={scene} />
        ))}
      </div>
    </section>
  );
};
