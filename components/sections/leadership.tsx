import { Reveal } from "@/components/scroll/reveal";
import { EDUCATION, LEADERSHIP } from "@/lib/resume";

export const Leadership = () => (
  <Reveal className="border-y border-zinc-800/70 bg-zinc-900/30 backdrop-blur-sm" id="about">
    <div className="mx-auto grid max-w-[1600px] gap-12 px-6 py-24 lg:grid-cols-2 lg:px-12">
      <div data-reveal>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Beyond the codebase
        </h2>
        <p className="mt-4 font-medium text-zinc-200">
          {LEADERSHIP.org}
        </p>
        <p className="text-sm text-zinc-500">
          {LEADERSHIP.role} · {LEADERSHIP.period}
        </p>
        <ul className="mt-6 space-y-3 text-zinc-400">
          {LEADERSHIP.bullets.map((bullet) => (
            <li className="leading-relaxed" key={bullet}>
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <div data-reveal>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Education
        </h2>
        <p className="mt-4 font-medium text-zinc-200">{EDUCATION.school}</p>
        <p className="text-sm text-zinc-500">{EDUCATION.period}</p>
        <p className="mt-6 leading-relaxed text-zinc-400">
          {EDUCATION.degree}, {EDUCATION.detail}.
        </p>
      </div>
    </div>
  </Reveal>
);
