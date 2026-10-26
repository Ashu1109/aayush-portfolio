import { KeyLight } from "@/components/key-light";
import { Reveal } from "@/components/scroll/reveal";
import { SKILLS } from "@/lib/resume";

/** The toolbox: heading holds its place while the groups scroll past it. */
export const Skills = () => (
  <Reveal className="relative isolate px-6 py-32 lg:px-[4vw] lg:py-40" id="skills">
    <KeyLight corner="bl" />
    <div className="grid gap-14 lg:grid-cols-[1fr_1.6fr] lg:gap-24">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <h2
          className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-none tracking-tight text-moss-50"
          data-split
        >
          The toolbox.
        </h2>
        <p className="mt-6 max-w-[30ch] text-[16px] leading-relaxed text-moss-400" data-reveal>
          What I reach for when a system has to stay up, stay ordered, and stay observable.
        </p>
      </div>
      <div className="space-y-12 lg:space-y-16">
        {SKILLS.map((group) => (
          <div data-reveal key={group.group}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-leaf-400">
              {group.group}
            </h3>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-heading text-[clamp(1.5rem,2.6vw,2.4rem)] font-medium leading-tight text-moss-200">
              {group.items.map((item) => (
                <span className="transition-colors hover:text-leaf-400" key={item}>
                  {item}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </div>
  </Reveal>
);
