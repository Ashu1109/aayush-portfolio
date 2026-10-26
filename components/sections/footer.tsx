import { KeyLight } from "@/components/key-light";
import { Reveal } from "@/components/scroll/reveal";
import { CONTACT, LINKS } from "@/lib/resume";

const LINK =
  "text-lg text-moss-200 underline decoration-leaf-400/50 underline-offset-8 transition-colors hover:text-leaf-300";

export const Footer = () => (
  <footer className="relative isolate overflow-hidden" id="contact">
    <KeyLight corner="bl" />
    <Reveal className="px-6 pb-28 pt-32 lg:px-[4vw] lg:pb-32 lg:pt-48">
      <a
        className="block w-fit text-[clamp(3.5rem,12vw,12rem)] font-bold leading-[0.9] tracking-tight text-leaf-400 transition-colors hover:text-moss-100"
        data-split
        href={`mailto:${CONTACT.email}`}
      >
        Let&apos;s talk.
      </a>
      <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4" data-reveal>
        <a className={LINK} href={`mailto:${CONTACT.email}`}>
          {CONTACT.email}
        </a>
        <a className={LINK} href={LINKS.linkedin} rel="noreferrer" target="_blank">
          LinkedIn
        </a>
        <a className={LINK} href={LINKS.githubPersonal} rel="noreferrer" target="_blank">
          GitHub
        </a>
        <a className={LINK} href={LINKS.githubWork} rel="noreferrer" target="_blank">
          GitHub (work)
        </a>
        <span className="text-moss-500">{CONTACT.phone}</span>
      </div>
      <div
        className="mt-28 flex flex-wrap items-center justify-between gap-4 border-t border-moss-800/70 pt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-moss-600"
        data-reveal
      >
        <p>
          {CONTACT.name} / {CONTACT.location}
        </p>
        <a className="transition-colors hover:text-leaf-300" href="#top">
          Back to top
        </a>
      </div>
    </Reveal>
  </footer>
);
