"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import Image from "next/image";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

/** Fired on window once the loader hands the stage over; SmoothScroll listens. */
export const LOADER_DONE = "loader:done";

// Never hold the page hostage to a slow asset.
const MAX_WAIT_MS = 4000;

/**
 * Branded preloader: the sprite's silhouette fills with its own glow while
 * fonts and images settle, then the backdrop dissolves onto the stage, where
 * the real sprite sits in the same spot. Scroll is locked until then.
 * Skipped entirely under reduced motion.
 */
export const Loader = ({ onDone }: { onDone: () => void }) => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = scope.current;
      const count = el?.querySelector("[data-count]");
      const fill = el?.querySelector("[data-fill]");
      if (!el || !count || !fill) {
        return;
      }

      const finish = () => {
        document.documentElement.style.overflow = "";
        window.dispatchEvent(new Event(LOADER_DONE));
        onDone();
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { display: "none" });
        finish();
        return;
      }

      document.documentElement.style.overflow = "hidden";
      const progress = { value: 0 };
      const draw = () => {
        count.textContent = String(Math.round(progress.value * 100)).padStart(3, "0");
        gsap.set(fill, { clipPath: `inset(${(1 - progress.value) * 100}% 0 0 0)` });
      };
      // Crawl to 90% on a timer, then close out once assets are actually in.
      const crawl = gsap.to(progress, { duration: 1.6, ease: "power1.out", onUpdate: draw, value: 0.9 });

      // Lazy images never start decoding offscreen, so only wait on eager ones.
      const pending = Array.from(document.images)
        .filter((img) => !img.complete && img.loading !== "lazy")
        .map((img) => img.decode().catch(() => undefined));
      const ready = Promise.race([
        Promise.all([document.fonts.ready, ...pending]),
        new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS)),
      ]);

      let cancelled = false;
      Promise.all([ready, crawl.then()]).then(() => {
        if (cancelled) {
          return;
        }
        gsap
          .timeline({ onComplete: () => gsap.set(el, { display: "none" }) })
          .to(progress, { duration: 0.45, ease: "power2.inOut", onUpdate: draw, value: 1 })
          .add(finish)
          .to(el, { autoAlpha: 0, duration: 0.9, ease: "power2.out" });
      });

      return () => {
        cancelled = true;
        document.documentElement.style.overflow = "";
      };
    },
    { scope }
  );

  return (
    <div
      aria-hidden
      // Failsafe: if JS never takes over, the overlay still clears itself.
      className="fixed inset-0 z-[70] flex items-center justify-center bg-moss-950 [animation:loader-failsafe_0.6s_6s_forwards] motion-reduce:hidden"
      data-loader
      ref={scope}
    >
      {/* Same footprint as the stage sprite so the hand-off is seamless. */}
      <div className="relative aspect-[441/428] w-[min(62vw,30dvh)] lg:w-[min(34vw,480px,52dvh)]">
        <Image
          alt=""
          className="absolute inset-0 h-full w-full object-contain opacity-[0.07] brightness-0 invert"
          height={428}
          src="/sprite/front.webp"
          unoptimized
          width={441}
        />
        <div className="absolute inset-0" data-fill style={{ clipPath: "inset(100% 0 0 0)" }}>
          <Image
            alt=""
            className="h-full w-full object-contain"
            height={428}
            src="/sprite/front.webp"
            unoptimized
            width={441}
          />
        </div>
      </div>
      <p className="absolute bottom-8 left-6 font-mono text-[11px] uppercase tracking-[0.3em] text-moss-500 lg:left-12">
        Waking the sprite
      </p>
      <p
        className="absolute bottom-8 right-6 font-mono text-sm tabular-nums text-leaf-400 lg:right-12"
        data-count
      >
        000
      </p>
    </div>
  );
};
