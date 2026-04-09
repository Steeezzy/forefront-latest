import { CheckCircle2, CircleDashed, Sparkles } from "lucide-react";
import type { IndustryLaunchChecklistItem } from "@/types/industry-experience";

interface IndustryLaunchChecklistProps {
  items: IndustryLaunchChecklistItem[];
}

const STATUS_STYLES = {
  included: {
    icon: CheckCircle2,
    iconClass: "text-[#15803d]",
    pillClass: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  },
  recommended: {
    icon: Sparkles,
    iconClass: "text-[#2563eb]",
    pillClass: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]",
  },
  optional: {
    icon: CircleDashed,
    iconClass: "text-[#64748b]",
    pillClass: "bg-[#f8fafc] text-[#64748b] border-[#dbe4f0]",
  },
} as const;

export function IndustryLaunchChecklist({
  items,
}: IndustryLaunchChecklistProps) {
  return (
    <div className="rounded-3xl border border-[#dbe4f0] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
            Launch Checklist
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#0a192f]">
            Everything queued for go-live
          </h3>
        </div>
        <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
          {items.length} items
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => {
          const style = STATUS_STYLES[item.status];
          const Icon = style.icon;

          return (
            <div
              key={item.label}
              className="flex items-start gap-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
            >
              <Icon size={18} className={`mt-0.5 ${style.iconClass}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-[#0a192f]">{item.label}</div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.pillClass}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#64748b]">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
