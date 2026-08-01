"use client";

import { Sculpture } from "@/components/three/sculpture";
import { CONTACT } from "@/lib/resume";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const [firstName, lastName] = CONTACT.name.split(" ");

export const Hero = () => {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Curtain reveal: each display line rises out of its clip wrapper.
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .from("[data-hero-line]", {
            duration: 1.2,
            stagger: 0.14,
            yPercent: 110,
          })
          .from(
            "[data-hero-fade]",
            { duration: 0.9, ease: "power3.out", opacity: 0, stagger: 0.1, y: 28 },
            "-=0.7"
          )
          .from(
            "[data-hero-robot]",
            { duration: 1.4, ease: "power2.out", opacity: 0, y: 80 },
            "-=1.0"
          );

        // Depth parallax: the name drifts as the next act arrives.
        gsap.to("[data-hero-name]", {
          ease: "none",
          scrollTrigger: {
            end: "bottom top",
            scrub: true,
            start: "top top",
            trigger: scope.current,
          },
          yPercent: 22,
        });
      });
    },
    { scope }
  );

  return (
    <section
      className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden"
      id="hero"
      ref={scope}
    >
      <div
        className="absolute right-[2vw] top-1/2 z-0 hidden h-[70vh] w-[38vw] -translate-y-1/2 lg:block"
        data-hero-robot
      >
        <Sculpture className="h-full w-full" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-[7vh] lg:px-12">
        <p
          className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-amber-400"
          data-hero-fade
        >
          Full Stack AI Engineer
        </p>

        <h1
          className="select-none text-[clamp(4.5rem,15vw,15rem)] font-black uppercase leading-[0.85] tracking-tighter"
          data-hero-name
        >
          <span className="block overflow-hidden pb-1">
            <span className="block text-zinc-100" data-hero-line>
              {firstName}
            </span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span className="text-outline block" data-hero-line>
              {lastName}
            </span>
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between lg:max-w-[58%]">
          <p
            className="max-w-md text-lg leading-relaxed text-zinc-400"
            data-hero-fade
          >
            I build event-driven platforms that keep multi-agent systems
            honest.
          </p>
          <div className="flex items-center gap-4" data-hero-fade>
            <a
              className="rounded-full bg-amber-400 px-8 py-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 active:scale-[0.98]"
              href="#chat"
            >
              Ask my AI
            </a>
            <a
              className="rounded-full border border-zinc-700 px-8 py-4 text-sm font-medium text-zinc-200 transition-colors hover:border-amber-400/60 hover:text-amber-300 active:scale-[0.98]"
              href={`mailto:${CONTACT.email}`}
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
