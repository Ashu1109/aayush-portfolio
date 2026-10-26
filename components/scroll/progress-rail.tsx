"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Thin right-edge rail whose thumb tracks how far down the page you are. */
export const ProgressRail = () => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = scope.current;
      const thumb = track?.firstElementChild as HTMLElement | null;
      if (!track || !thumb) {
        return;
      }
      gsap.to(thumb, {
        ease: "none",
        scrollTrigger: { end: "max", invalidateOnRefresh: true, scrub: true, start: 0 },
        y: () => track.clientHeight - thumb.clientHeight,
      });
    },
    { scope }
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed right-3 top-1/2 z-30 hidden h-[36vh] w-px -translate-y-1/2 bg-moss-800 md:block"
      ref={scope}
    >
      <div className="h-[16%] w-full bg-leaf-400" />
    </div>
  );
};
