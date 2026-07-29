"use client";

import { EXPERIENCE } from "@/lib/resume";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The work-history act: the stage pins while scroll scrubs through one scene
 * per company. Without motion (or reduced motion), scenes render as plain
 * stacked sections; the pinned choreography is layered on top with GSAP.
 */
export const Journey = () => {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const stage = scope.current?.querySelector("[data-stage]");
        const progress = scope.current?.querySelector("[data-progress]");
        const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]");
        if (!stage || scenes.length < 2) {
          return;
        }

        gsap.set(stage, { height: "100dvh" });
        gsap.set(scenes, {
          inset: 0,
          margin: 0,
          position: "absolute",
        });
        gsap.set(scenes.slice(1), { autoAlpha: 0 });
        gsap.set(progress ?? null, { scaleX: 0, transformOrigin: "left center" });

        const tl = gsap.timeline({
          scrollTrigger: {
            end: `+=${scenes.length * 120}%`,
            pin: true,
            scrub: 1,
            start: "top top",
            trigger: stage,
          },
        });

        scenes.forEach((scene, index) => {
          if (index === 0) {
            return;
          }
          const prev = scenes[index - 1];
          tl.to(prev.querySelector("[data-scene-title]"), {
            ease: "none",
            xPercent: -12,
          })
            .to(prev, { autoAlpha: 0, ease: "none" }, "<")
            .fromTo(
              scene,
              { autoAlpha: 0 },
              { autoAlpha: 1, ease: "none" },
              "<40%"
            )
            .fromTo(
              scene.querySelector("[data-scene-title]"),
              { xPercent: 8 },
              { ease: "none", xPercent: 0 },
              "<"
            );
        });

        if (progress) {
          tl.to(progress, { ease: "none", scaleX: 1 }, 0);
        }
      });
    },
    { scope }
  );

  return (
    <section className="relative" id="journey" ref={scope}>
      <div className="relative" data-stage>
        {EXPERIENCE.map((job, index) => (
          <article
            className="flex min-h-[80vh] items-center overflow-hidden py-20"
            data-scene
            key={job.company}
          >
            <div className="mx-auto w-full max-w-[1600px] px-6 lg:px-12">
              <p className="font-mono text-sm tracking-widest text-amber-400">
                {job.period}
              </p>
              <h3
                className={`mt-4 whitespace-nowrap text-[clamp(2.6rem,8vw,8rem)] font-black uppercase leading-[0.9] tracking-tighter ${
                  index % 2 === 1 ? "text-outline" : "text-zinc-100"
                }`}
                data-scene-title
              >
                {job.company}
              </h3>
              <p className="mt-4 text-xl text-zinc-400">{job.role}</p>
              <div className="mt-10 grid gap-10 lg:grid-cols-[3fr_2fr]">
                <ul className="max-w-2xl space-y-4 text-zinc-300">
                  {job.highlights.map((highlight) => (
                    <li
                      className="border-l border-amber-400/40 pl-5 leading-relaxed"
                      key={highlight}
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap content-start gap-2 self-start">
                  {job.stack.map((item) => (
                    <span
                      className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 font-mono text-xs uppercase tracking-wider text-zinc-500"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
        <div className="absolute inset-x-0 bottom-0 hidden h-px bg-zinc-800 md:block">
          <div className="h-full bg-amber-400" data-progress />
        </div>
      </div>
    </section>
  );
};
