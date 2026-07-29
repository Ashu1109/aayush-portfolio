"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Enter-on-scroll reveal: children marked with [data-reveal] rise and fade in
 * with a stagger the first time the wrapper scrolls into view. Static under
 * reduced motion.
 */
export const Reveal = ({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-reveal]", {
          // Clear inline transforms afterward so ancestors never become
          // containing blocks for fixed-position children (fullscreen chat).
          clearProps: "all",
          duration: 0.9,
          ease: "power3.out",
          opacity: 0,
          scrollTrigger: {
            start: "top 78%",
            trigger: scope.current,
          },
          stagger: 0.08,
          y: 36,
        });
      });
    },
    { scope }
  );

  return (
    <div className={className} id={id} ref={scope}>
      {children}
    </div>
  );
};
