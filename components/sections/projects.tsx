import { Reveal } from "@/components/scroll/reveal";
import { PROJECTS } from "@/lib/resume";
import { ArrowUpRightIcon } from "lucide-react";

export const Projects = () => (
  <Reveal className="mx-auto max-w-[1600px] px-6 py-32 lg:px-12" id="projects">
    <h2
      className="text-4xl font-semibold tracking-tighter text-zinc-100 sm:text-5xl"
      data-reveal
    >
      Built things
    </h2>
    <div className="mt-16">
      {PROJECTS.map((project) => (
        <article
          className="group grid gap-6 border-t border-zinc-800/70 py-12 transition-colors hover:bg-zinc-900/30 lg:grid-cols-[2fr_3fr] lg:gap-16"
          data-reveal
          key={project.name}
        >
          <div className="flex items-start gap-3">
            <h3 className="text-3xl font-semibold tracking-tight text-zinc-100 transition-transform duration-300 group-hover:translate-x-2">
              {project.name}
            </h3>
            <ArrowUpRightIcon className="mt-1.5 size-6 text-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div>
            <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
              {project.description}
            </p>
            <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">
              {project.stack.join("  /  ")}
            </p>
          </div>
        </article>
      ))}
    </div>
  </Reveal>
);
