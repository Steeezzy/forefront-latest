import { Layers3 } from "lucide-react";
import type { IndustryCapabilityModule } from "@/types/industry-experience";

interface IndustryCapabilityMatrixProps {
  modules: IndustryCapabilityModule[];
}

export function IndustryCapabilityMatrix({
  modules,
}: IndustryCapabilityMatrixProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {modules.map((module, index) => (
        <div
          key={module.id}
          className="rounded-3xl border border-[#dbe4f0] bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
              <Layers3 size={18} />
            </div>
            <span className="rounded-full border border-[#dbe4f0] px-2.5 py-1 text-xs font-semibold text-[#64748b]">
              0{index + 1}
            </span>
          </div>

          <h3 className="mt-5 text-lg font-semibold text-[#0a192f]">{module.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
            {module.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {module.channels.map((channel) => (
              <span
                key={channel}
                className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#475569]"
              >
                {channel}
              </span>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            {module.highlights.map((highlight) => (
              <div key={highlight} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
                <p className="text-sm leading-relaxed text-[#475569]">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
