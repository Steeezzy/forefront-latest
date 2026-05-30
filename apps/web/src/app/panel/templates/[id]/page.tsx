import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, PlugZap } from "lucide-react";

import { TEMPLATES } from "@/data/templates";

interface TemplateDetailsPageProps {
  params: {
    id: string;
  };
}

export default function TemplateDetailsPage({ params }: TemplateDetailsPageProps) {
  const template = TEMPLATES.find((item) => item.id === params.id);

  if (!template) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/panel/templates"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] hover:text-[#0f172a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to templates
        </Link>

        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#64748b]">
                {template.category} template
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">{template.name}</h1>
              <p className="mt-3 text-base text-[#475569]">{template.description}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f5f9] text-2xl">
              {template.icon}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Function</p>
              <p className="mt-2 text-sm font-medium text-[#0f172a]">{template.function}</p>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Complexity</p>
              <p className="mt-2 text-sm font-medium capitalize text-[#0f172a]">{template.complexity}</p>
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Setup Time</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#0f172a]">
                <Clock className="h-4 w-4 text-[#64748b]" />
                {template.setupTime}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#0f172a]">Required Integrations</h2>
          {template.requiredIntegrations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {template.requiredIntegrations.map((integration) => (
                <span
                  key={integration}
                  className="inline-flex items-center gap-2 rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-3 py-1 text-sm text-[#334155]"
                >
                  <PlugZap className="h-3.5 w-3.5" />
                  {integration}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">No required integrations for this template.</p>
          )}
        </section>

        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#0f172a]">Industries</h2>
          <div className="flex flex-wrap gap-2">
            {template.industries.map((industry) => (
              <span
                key={industry}
                className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-sm capitalize text-[#334155]"
              >
                {industry}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
