"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AGENT_TEMPLATES, INDUSTRIES } from "@/components/voice-agents/template-data";

export default function Templates() {
    // Show just 6 featured templates
    const featuredTemplates = AGENT_TEMPLATES.slice(0, 6);

    return (
        <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Start with a template</h2>
                        <p className="text-gray-600">
                            Industry-specific voice agents ready to customize.
                        </p>
                    </div>
                    <Link
                        href="/templates"
                        className="inline-flex items-center gap-2 text-gray-900 font-medium hover:gap-3 transition-all"
                    >
                        View all templates
                        <ArrowRight size={18} />
                    </Link>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredTemplates.map((template) => {
                        const industry = INDUSTRIES.find((i) => i.id === template.industryId) || INDUSTRIES[0];
                        return (
                            <Link
                                key={template.id}
                                href={`/templates/${template.id}`}
                                className="group block p-6 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <span className="text-lg">🤖</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{template.name}</div>
                                            <div className="text-xs text-gray-500">{industry.label}</div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                                    {template.summary}
                                </p>

                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                                        {template.direction}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                        {template.mode === 'multi' ? 'Multi-prompt' : 'Single-prompt'}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
