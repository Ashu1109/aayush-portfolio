import { CONTACT } from "@/lib/resume";

const LINKS = [
  { href: "#journey", label: "Journey" },
  { href: "#chat", label: "Chat" },
  { href: "#contact", label: "Contact" },
] as const;

export const Nav = () => (
  <header className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-zinc-950 via-zinc-950/60 to-transparent pb-6 [&_a]:pointer-events-auto">
    <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-12">
      <a
        className="whitespace-nowrap text-sm font-semibold tracking-tight text-zinc-100 transition-colors hover:text-amber-300 sm:text-base"
        href="#top"
      >
        {CONTACT.name}
      </a>
      <div className="flex items-center gap-4 sm:gap-8">
        {LINKS.map((link) => (
          <a
            className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-amber-300"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  </header>
);
