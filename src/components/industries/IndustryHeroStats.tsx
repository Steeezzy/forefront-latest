import type { IndustryHeroStat } from "@/types/industry-experience";

interface IndustryHeroStatsProps {
  items: IndustryHeroStat[];
}

export function IndustryHeroStats({ items }: IndustryHeroStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-[#dbe4f0] bg-white p-5 shadow-sm"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
            {item.label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[#0a192f]">
            {item.value}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}
