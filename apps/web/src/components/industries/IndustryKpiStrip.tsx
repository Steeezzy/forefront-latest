import { ArrowRight, Minus, TrendingUp } from "lucide-react";
import type { IndustryKpiSnapshot } from "@/types/industry-experience";

interface IndustryKpiStripProps {
  items: IndustryKpiSnapshot[];
}

const TREND_STYLES = {
  up: {
    icon: TrendingUp,
    color: "text-[#15803d]",
    bg: "bg-[#f0fdf4]",
  },
  flat: {
    icon: Minus,
    color: "text-[#475569]",
    bg: "bg-[#f8fafc]",
  },
  watch: {
    icon: ArrowRight,
    color: "text-[#b45309]",
    bg: "bg-[#fffbeb]",
  },
} as const;

export function IndustryKpiStrip({ items }: IndustryKpiStripProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const style = TREND_STYLES[item.trend];
        const Icon = style.icon;

        return (
          <div
            key={item.label}
            className="rounded-3xl border border-[#dbe4f0] bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[#0a192f]">{item.label}</div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${style.bg} ${style.color}`}
              >
                <Icon size={16} />
              </div>
            </div>

            <div className="mt-4 text-3xl font-semibold tracking-tight text-[#0a192f]">
              {item.value}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{item.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
