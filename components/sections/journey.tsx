"use client";

import { KeyLight } from "@/components/key-light";
import { EXPERIENCE } from "@/lib/resume";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Image from "next/image";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * The work history, staged like the opening act: one company per scene, the
 * name resolving letter by letter from a blur, with its period and stack in
 * the top corners and highlights as quiet columns underneath. The stage pins
 * while scroll scrubs between scenes and the sprite walks the timeline.
 * Without motion (or reduced motion), scenes render as stacked sections.
 */
export const Journey = () => {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      const stage = root?.querySelector<HTMLElement>("[data-stage]");
      const progress = root?.querySelector("[data-progress]");
      const walker = root?.querySelector<HTMLElement>("[data-walker]");
      const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]", root);
      if (!root || !stage || scenes.length < 2) {
        return;
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(stage, { height: "100dvh", overflow: "hidden" });
        gsap.set(scenes, { inset: 0, minHeight: 0, position: "absolute" });
        gsap.set(scenes.slice(1), { autoAlpha: 0 });
        gsap.set(progress ?? null, { scaleX: 0, transformOrigin: "left center" });

        const titles = scenes.map((scene) =>
          SplitText.create(scene.querySelector("[data-scene-title]"), { type: "words,chars" })
        );
        const fades = scenes.map((scene) => scene.querySelectorAll("[data-fade]"));

        // The first scene resolves as the section arrives, before the pin.
        gsap.from(titles[0].chars, {
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          filter: "blur(12px)",
          scrollTrigger: { start: "top 65%", trigger: root },
          stagger: 0.03,
          yPercent: 40,
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            end: `+=${scenes.length * 100}%`,
            invalidateOnRefresh: true,
            pin: stage,
            scrub: true,
            start: "top top",
            trigger: stage,
          },
        });

        scenes.forEach((scene, index) => {
          if (index === 0) {
            return;
          }
          tl.to(titles[index - 1].chars, {
            autoAlpha: 0,
            duration: 0.5,
            ease: "power1.in",
            filter: "blur(10px)",
            stagger: 0.015,
            yPercent: -30,
          })
            .to(fades[index - 1], { autoAlpha: 0, duration: 0.4, y: -20 }, "<")
            .set(scenes[index - 1], { autoAlpha: 0 })
            .set(scene, { autoAlpha: 1 })
            .fromTo(
              titles[index].chars,
              { autoAlpha: 0, filter: "blur(12px)", yPercent: 40 },
              { autoAlpha: 1, duration: 0.6, ease: "power2.out", filter: "blur(0px)", stagger: 0.025, yPercent: 0 }
            )
            .fromTo(
              fades[index],
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, duration: 0.5, ease: "power2.out", stagger: 0.06, y: 0 },
              "<0.2"
            )
            .to({}, { duration: 0.5 });
        });

        // Progress and walker span the whole timeline; without an explicit
        // duration they'd take GSAP's 0.5s default and finish a scene early.
        const span = tl.duration();

        if (progress) {
          tl.to(progress, { duration: span, ease: "none", scaleX: 1 }, 0);
        }

        // The sprite walks the progress line, hopping in step with the scroll.
        if (walker?.parentElement) {
          const track = walker.parentElement;
          gsap.set(walker, { autoAlpha: 1 });
          tl.to(walker, { duration: span, ease: "none", x: () => track.clientWidth - walker.offsetWidth }, 0).to(
            walker,
            {
              duration: span / (scenes.length * 8),
              ease: "sine.inOut",
              repeat: scenes.length * 8 - 1,
              y: -6,
              yoyo: true,
            },
            0
          );
        }
      });
    },
    { scope }
  );

  return (
    <section className="relative isolate" id="journey" ref={scope}>
      <div className="relative" data-stage>
        {EXPERIENCE.map((job, index) => (
          <article
            className="relative flex min-h-[100dvh] flex-col justify-between gap-8 px-6 pb-16 pt-24 lg:gap-12 lg:px-[4vw] lg:pb-[13vh] lg:pt-[14vh]"
            data-scene
            key={job.company}
          >
            <KeyLight corner={index % 2 === 0 ? "bl" : "tr"} />
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div data-fade>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-leaf-400">
                  {job.period}
                </p>
                <p className="mt-2 text-sm text-moss-300">{job.role}</p>
              </div>
              <p
                className="max-w-[26rem] font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-moss-500 sm:text-right"
                data-fade
              >
                {job.stack.join(" / ")}
              </p>
            </div>

            <div>
              <h3
                className={`text-[clamp(3.5rem,13vw,13rem)] font-bold leading-[0.88] tracking-tight ${
                  index % 2 === 1 ? "text-leaf-400" : "text-moss-50"
                }`}
                data-scene-title
              >
                {job.company}
              </h3>
              <p
                className="mt-6 max-w-[34ch] text-xl leading-snug text-moss-200 lg:text-2xl"
                data-fade
              >
                {job.summary}
              </p>
            </div>

            {/* Top three highlights; phones show two so a pinned scene never
                overflows the stage. */}
            <div className="grid gap-5 lg:grid-cols-3 lg:gap-10">
              {job.highlights.slice(0, 3).map((highlight) => (
                <p
                  className="border-t border-moss-800 pt-4 text-[14px] leading-relaxed text-moss-400 max-lg:[&:nth-child(n+3)]:hidden"
                  data-fade
                  key={highlight}
                >
                  {highlight}
                </p>
              ))}
            </div>
          </article>
        ))}
        <div className="absolute inset-x-0 bottom-0 hidden h-px bg-moss-800 md:block">
          <div className="h-full bg-leaf-400" data-progress />
          {/* Hidden until the pinned timeline exists to move it. */}
          <Image
            alt=""
            className="invisible absolute bottom-0 left-0 w-12"
            data-walker
            height={426}
            src="/sprite/side.webp"
            unoptimized
            width={391}
          />
        </div>
      </div>
    </section>
  );
};
