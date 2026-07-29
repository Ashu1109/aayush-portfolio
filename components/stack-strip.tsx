const STACK = [
  "Kafka",
  "PostgreSQL",
  "Next.js",
  "Terraform",
  "Claude",
  "Redis",
  "AWS ECS",
  "Docker",
  "Prisma",
  "OpenTelemetry",
];

const Row = ({ hidden }: { hidden?: boolean }) => (
  <div
    aria-hidden={hidden}
    className="flex shrink-0 items-center gap-10 pr-10"
  >
    {STACK.map((item) => (
      <span
        className="whitespace-nowrap font-mono text-sm uppercase tracking-[0.25em] text-zinc-600"
        key={item}
      >
        {item}
      </span>
    ))}
  </div>
);

/** One kinetic type strip: the stack drifting past like end credits. */
export const StackStrip = () => (
  <div className="overflow-hidden border-y border-zinc-800/60 py-5">
    <div className="animate-marquee flex w-max">
      <Row />
      <Row hidden />
    </div>
  </div>
);
