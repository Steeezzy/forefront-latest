import { ShieldCheck } from "lucide-react";
import type { IndustryComplianceBadge } from "@/types/industry-experience";

interface IndustryComplianceBadgesProps {
  items: IndustryComplianceBadge[];
}

const BADGE_STYLES = {
  ready: {
    pill: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
    icon: "bg-[#dcfce7] text-[#15803d]",
  },
  review: {
    pill: "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
    icon: "bg-[#fef3c7] text-[#b45309]",
  },
  optional: {
    pill: "bg-[#f8fafc] text-[#475569] border-[#dbe4f0]",
    icon: "bg-[#e2e8f0] text-[#475569]",
  },
} as const;

export function IndustryComplianceBadges({
  items,
}: IndustryComplianceBadgesProps) {
  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const style = BADGE_STYLES[item.tone];

        return (
          <div
            key={item.label}
            className="rounded-3xl border border-[#dbe4f0] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.icon}`}
              >
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#0a192f]">{item.label}</h3>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.pill}`}
                  >
                    {item.tone}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                  {item.note}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
