"use client";

import { LOADER_DONE } from "@/components/stage/loader";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scrolling wired into GSAP's ticker so ScrollTrigger and the
 * scroll position never drift apart. Skipped entirely under reduced motion.
 */
export const SmoothScroll = () => {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({ autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);

    // Hold still until the loader hands over the stage.
    const release = () => lenis.start();
    if (document.querySelector("[data-loader]")) {
      lenis.stop();
      window.addEventListener(LOADER_DONE, release, { once: true });
    }

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener(LOADER_DONE, release);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
};
