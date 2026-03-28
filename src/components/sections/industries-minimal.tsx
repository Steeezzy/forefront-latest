"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INDUSTRIES, AGENT_TEMPLATES } from "@/components/voice-agents/template-data";

export default function Industries() {
    // Count templates per industry
    const industryCounts = INDUSTRIES.map((industry) => ({
        ...industry,
        count: AGENT_TEMPLATES.filter((t) => t.industryId === industry.id).length,
    })).filter((i) => i.count > 0);

    return (
        <section className="py-24 px-6 bg-gray-50/50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Built for every industry</h2>
                    <p className="text-gray-600">
                        From healthcare to logistics—pre-configured and ready to deploy.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {industryCounts.map((industry) => (
                        <Link
                            key={industry.id}
                            href={`/industries#${industry.id}`}
                            className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-white transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📦</span>
                                <span className="font-medium text-gray-900">{industry.label}</span>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {industry.count}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
