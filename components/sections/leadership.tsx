import { KeyLight } from "@/components/key-light";
import { Reveal } from "@/components/scroll/reveal";
import { EDUCATION, LEADERSHIP } from "@/lib/resume";

const TILE =
  "relative isolate overflow-hidden rounded-3xl border border-moss-800/80 bg-moss-900/40 p-8 backdrop-blur-sm lg:p-10";
const META = "mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-moss-500";
const STAT = "font-heading text-[clamp(4rem,9vw,8rem)] font-bold leading-none tracking-tight";

// LEADERSHIP is most recent first.
const [enablement, club] = LEADERSHIP;

/** Beyond the codebase: four tiles, sized by how much they say. */
export const Leadership = () => (
  <Reveal className="relative isolate px-6 py-32 lg:px-[4vw] lg:py-40" id="about">
    <h2
      className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-none tracking-tight text-moss-50"
      data-split
    >
      Beyond the codebase.
    </h2>
    <div className="mt-16 grid gap-4 lg:mt-20 lg:grid-cols-3 lg:gap-6">
      <div className={`${TILE} lg:col-span-2`} data-reveal>
        <KeyLight corner="tl" />
        <p className={`${STAT} text-leaf-400`}>200+</p>
        <p className="mt-4 max-w-[38ch] text-lg leading-relaxed text-moss-200">{club.bullets[0]}</p>
        <p className={META}>
          {club.role}, {club.org}
        </p>
      </div>
      <div className={TILE} data-reveal>
        <p className={`${STAT} text-moss-50`}>50+</p>
        <p className="mt-4 text-lg leading-relaxed text-moss-200">{club.bullets[1]}</p>
        <p className={META}>{club.period}</p>
      </div>
      <div className={TILE} data-reveal>
        <p className="font-heading text-[clamp(1.75rem,2.6vw,2.5rem)] font-semibold leading-tight tracking-tight text-moss-50">
          {enablement.role}
        </p>
        <p className="mt-4 text-lg leading-relaxed text-moss-200">{enablement.bullets[0]}</p>
        <p className={META}>
          {enablement.org}, {enablement.period}
        </p>
      </div>
      <div className={`${TILE} flex flex-col justify-end lg:col-span-2`} data-reveal>
        <KeyLight corner="br" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-heading text-[clamp(1.75rem,3.2vw,3rem)] font-semibold leading-tight tracking-tight text-moss-50">
              {EDUCATION.school}
            </p>
            <p className="mt-3 text-lg text-moss-300">
              {EDUCATION.degree}, {EDUCATION.detail}
            </p>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-moss-500">
            {EDUCATION.period}
          </p>
        </div>
      </div>
    </div>
  </Reveal>
);
