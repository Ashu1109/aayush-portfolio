import { Reveal } from "@/components/scroll/reveal";
import { CONTACT, LINKS } from "@/lib/resume";

export const Footer = () => (
  <footer className="border-t border-zinc-800/70" id="contact">
    <Reveal className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12">
      <a
        className="text-outline block text-[clamp(3rem,11vw,10rem)] font-black uppercase leading-[0.9] tracking-tighter transition-colors hover:text-amber-400 hover:[-webkit-text-stroke-width:0]"
        data-reveal
        href={`mailto:${CONTACT.email}`}
      >
        Let&apos;s talk
      </a>
      <div
        className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4"
        data-reveal
      >
        <a
          className="text-lg text-zinc-200 underline decoration-amber-400/60 underline-offset-8 transition-colors hover:text-amber-300"
          href={`mailto:${CONTACT.email}`}
        >
          {CONTACT.email}
        </a>
        <a
          className="text-lg text-zinc-200 underline decoration-amber-400/60 underline-offset-8 transition-colors hover:text-amber-300"
          href={LINKS.githubPersonal}
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
        <a
          className="text-lg text-zinc-200 underline decoration-amber-400/60 underline-offset-8 transition-colors hover:text-amber-300"
          href={LINKS.githubWork}
          rel="noreferrer"
          target="_blank"
        >
          GitHub (work)
        </a>
        <span className="text-zinc-500">{CONTACT.phone}</span>
      </div>
      <p className="mt-20 font-mono text-xs uppercase tracking-[0.2em] text-zinc-600" data-reveal>
        {CONTACT.name} / {CONTACT.location}
      </p>
    </Reveal>
  </footer>
);
