"use client";

import { createSpriteBrain, SPRITE_CHEER } from "@/components/sprite-brain";
import { SpriteFace } from "@/components/sprite-face";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The sprite after the opening act: docked bottom-right as a shortcut to the
 * contact section. The story's finale flies the stage sprite onto this exact
 * box, so it appears instantly when the story ends. It steps aside while the
 * journey's walker has the stage, and cheers at the footer.
 */
export const Companion = () => {
  const scope = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const el = scope.current;
      // Elements, not selectors: useGSAP's scope would look for these inside the link.
      const hero = document.getElementById("hero");
      const journey = document.getElementById("journey");
      const footer = document.getElementById("contact");
      if (!el || !hero || !journey || !footer) {
        return;
      }
      let pastStory = false;
      let inJourney = false;

      const apply = (instant: boolean) => {
        const show = pastStory && !inJourney;
        gsap.set(el, { autoAlpha: show ? 1 : 0 });
        gsap.to("[data-companion-body]", {
          duration: instant ? 0 : 0.35,
          ease: "back.out(2)",
          overwrite: "auto",
          scale: show ? 1 : 0.6,
        });
      };

      ScrollTrigger.create({
        onEnter: () => {
          pastStory = true;
          apply(true);
        },
        onLeaveBack: () => {
          pastStory = false;
          apply(true);
        },
        start: "bottom bottom",
        trigger: hero,
      });
      ScrollTrigger.create({
        end: "bottom 40%",
        onToggle: (self) => {
          inJourney = self.isActive;
          apply(false);
        },
        start: "top 60%",
        trigger: journey,
      });
      ScrollTrigger.create({
        onEnter: () => el.dispatchEvent(new Event(SPRITE_CHEER)),
        start: "top 70%",
        trigger: footer,
      });

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-companion-bob]", {
          duration: 1.6,
          ease: "sine.inOut",
          repeat: -1,
          y: -4,
          yoyo: true,
        });
        // Same face and moods as the stage sprite: it watches you, blinks,
        // smiles on hover, and dozes off in the corner if left alone.
        return createSpriteBrain(el);
      });
    },
    { scope }
  );

  return (
    <a
      aria-label="Let's talk"
      className="group invisible fixed bottom-6 right-6 z-30 block aspect-[441/428] w-16 lg:bottom-8 lg:right-8 lg:w-20"
      data-companion
      href="#contact"
      ref={scope}
    >
      <span className="absolute inset-0 block" data-companion-body>
        <span className="absolute inset-0 block" data-companion-bob>
          <span className="absolute inset-0 block" data-gesture data-poke style={{ transformOrigin: "50% 100%" }}>
            <Image
              alt=""
              className="h-full w-full object-contain drop-shadow-[0_0_18px_oklch(0.94_0.07_105/0.35)]"
              height={428}
              src="/sprite/front-faceless.webp"
              unoptimized
              width={441}
            />
            <SpriteFace className="absolute inset-0 h-full w-full" frame="front" />
          </span>
        </span>
      </span>
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-moss-100 px-3 py-1.5 text-xs font-semibold text-moss-950 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Let&apos;s talk
      </span>
    </a>
  );
};
