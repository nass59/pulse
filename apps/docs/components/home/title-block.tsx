/**
 * The drawing sheet's title block — the homepage's closing element, borrowed
 * from engineering drawings: bordered cells naming the project, its purpose,
 * and its revision state. The SOURCE cell is the sheet's last exit to the
 * repo. Static server component.
 */
const CELLS: { label: string; value: string; href?: string }[] = [
  { label: "PROJECT", value: "PULSE — event-streaming platform" },
  { label: "PURPOSE", value: "learning Kafka in public" },
  { label: "LANGS", value: "TS · Go · Kotlin" },
  { label: "REV", value: "phase 2 · in flight" },
  { label: "DATE", value: "2026-07" },
  {
    label: "SOURCE",
    value: "github.com/nass59/pulse",
    href: "https://github.com/nass59/pulse",
  },
];

export const TitleBlock = () => (
  <footer className="mt-[6vh] grid grid-cols-2 border-electric-yellow/25 border-t sm:grid-cols-3 lg:grid-cols-6">
    {CELLS.map((cell) => (
      <div
        className="flex flex-col gap-1 border-electric-yellow/15 border-r border-b px-4 py-3.5 lg:border-b-0 lg:last:border-r-0"
        key={cell.label}
      >
        <span className="font-mono text-[8.5px] text-white/35 tracking-[0.2em]">
          {cell.label}
        </span>
        {cell.href ? (
          <a
            className="w-fit border-electric-yellow/40 border-b font-mono font-semibold text-[11px] text-white/85 transition-colors hover:text-electric-yellow"
            href={cell.href}
          >
            {cell.value}
          </a>
        ) : (
          <b className="font-mono font-semibold text-[11px] text-white/85">
            {cell.value}
          </b>
        )}
      </div>
    ))}
  </footer>
);
