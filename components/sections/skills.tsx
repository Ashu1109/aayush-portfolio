import { Reveal } from "@/components/scroll/reveal";
import { SKILLS } from "@/lib/resume";

export const Skills = () => (
  <Reveal className="mx-auto max-w-[1600px] px-6 py-32 lg:px-12" id="skills">
    <h2
      className="max-w-3xl text-4xl font-semibold tracking-tighter text-zinc-100 sm:text-5xl"
      data-reveal
    >
      The toolbox
    </h2>
    <div className="mt-16 grid gap-y-12 border-t border-zinc-800/70 pt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-16">
      {SKILLS.map((group) => (
        <div data-reveal key={group.group}>
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-amber-400">
            {group.group}
          </h3>
          <p className="mt-4 text-xl leading-relaxed text-zinc-300">
            {group.items.join(", ")}
          </p>
        </div>
      ))}
    </div>
  </Reveal>
);
