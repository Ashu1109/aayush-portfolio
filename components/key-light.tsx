const CORNERS = {
  bl: "bg-[radial-gradient(55%_60%_at_0%_100%,oklch(0.8_0.12_130/0.12),transparent)]",
  br: "bg-[radial-gradient(55%_60%_at_100%_100%,oklch(0.8_0.12_130/0.12),transparent)]",
  tl: "bg-[radial-gradient(55%_60%_at_0%_0%,oklch(0.94_0.07_105/0.1),transparent)]",
  tr: "bg-[radial-gradient(55%_60%_at_100%_0%,oklch(0.94_0.07_105/0.1),transparent)]",
} as const;

/**
 * The opening act's corner light, reused so every section is lit the same
 * way. Sits behind content: the parent needs `relative isolate`.
 */
export const KeyLight = ({ corner }: { corner: keyof typeof CORNERS }) => (
  <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${CORNERS[corner]}`} />
);
