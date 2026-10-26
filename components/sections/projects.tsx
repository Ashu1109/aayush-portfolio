"use client";

import { KeyLight } from "@/components/key-light";
import { Reveal } from "@/components/scroll/reveal";
import { PROJECTS } from "@/lib/resume";
import type { PointerEvent } from "react";

// Spotlight follows the cursor inside a row; CSS vars, so no re-render.
const trackSpotlight = (event: PointerEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
};

/** Editorial index of shipped work: one oversized line per project. */
export const Projects = () => (
  <Reveal className="relative isolate px-6 py-32 lg:px-[4vw] lg:py-40" id="projects">
    <KeyLight corner="tr" />
    <h2
      className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-none tracking-tight text-moss-50"
      data-split
    >
      Things I shipped.
    </h2>
    <div className="mt-16 lg:mt-24">
      {PROJECTS.map((project) => (
        <article
          className="group relative grid gap-6 border-t border-moss-800/80 py-10 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16 lg:py-14"
          data-reveal
          key={project.name}
          onPointerMove={trackSpotlight}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(480px_circle_at_var(--x,50%)_var(--y,50%),oklch(0.8_0.12_130/0.09),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <h3 className="text-[clamp(2.25rem,5.5vw,5.5rem)] font-semibold leading-[0.95] tracking-tight text-moss-100 transition-[color,translate] duration-500 group-hover:translate-x-3 group-hover:text-leaf-400">
            {project.name}
          </h3>
          <div>
            <p className="max-w-[48ch] text-[16px] leading-relaxed text-moss-300">
              {project.description}
            </p>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-moss-500">
              {project.stack.join(" / ")}
            </p>
          </div>
        </article>
      ))}
    </div>
  </Reveal>
);
