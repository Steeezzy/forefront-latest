"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/sections/navbar";
import Footer from "@/components/sections/footer";
import { AGENT_TEMPLATES, INDUSTRIES, getAllIndustryTemplates } from "@/components/voice-agents/template-data";
import {
    ArrowLeft,
    Check,
    Play,
    ArrowRight,
    Bot,
    Zap,
    MessageSquare,
    Calendar,
    Settings,
} from "lucide-react";
import Link from "next/link";

const DIRECTION_LABELS = {
    inbound: "Inbound",
    outbound: "Outbound",
    webcall: "Webcall",
};

export default function TemplateDetailPage() {
    const params = useParams();
    const templateId = params.id as string;

    const template = useMemo(() => {
        return AGENT_TEMPLATES.find((t) => t.id === templateId);
    }, [templateId]);

    // Get other templates from same industry (excluding current)
    const relatedTemplates = useMemo(() => {
        if (!template) return [];
        const allInIndustry = getAllIndustryTemplates(template.industryId);
        return allInIndustry.filter((t) => t.id !== templateId).slice(0, 3);
    }, [template]);

    // Get industry definition
    const industry = useMemo(() => {
        if (!template) return null;
        return INDUSTRIES.find((ind) => ind.id === template.industryId) || INDUSTRIES[0];
    }, [template]);

    const requiredIntegrations = useMemo(() => {
        if (!template) return [] as string[];
        const t = template as any;
        return (t.requiredIntegrations || t.required_integrations || []) as string[];
    }, [template]);

    const handlePlayDemo = () => {
        alert("Demo audio would play here (connect to pre-recorded sample)");
    };

    if (!template) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="pt-32 pb-16 px-6 max-w-5xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Template not found</h1>
                    <Link href="/templates" className="text-indigo-600 hover:underline">
                        Back to templates
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-24 pb-16">
                {/* Breadcrumb */}
                <div className="px-6 max-w-5xl mx-auto mb-6">
                    <Link
                        href="/templates"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to templates
                    </Link>
                </div>

                {/* Hero */}
                <div className="px-6 max-w-5xl mx-auto mb-12">
                    <div className="grid md:grid-cols-3 gap-10">
                        <div className="md:col-span-2">
                            {/* Tags */}
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                                    {industry?.label || template.industryId}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                    {DIRECTION_LABELS[template.direction]}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                    {template.mode === 'multi' ? 'Multi-Prompt' : 'Single Prompt'}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                {template.name}
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed mb-6">
                                {template.summary}
                            </p>

                            {/* First Message Preview */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bot size={18} className="text-indigo-600" />
                                    <span className="font-semibold text-gray-900">First Interaction</span>
                                </div>
                                <p className="text-lg text-gray-800 italic">
                                    &ldquo;{template.firstMessage}&rdquo;
                                </p>
                            </div>

                            {/* What It Does */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap size={22} className="text-indigo-600" />
                                    What this agent does
                                </h2>
                                <ul className="grid md:grid-cols-2 gap-3">
                                    {template.guidelines.map((guideline, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700">{guideline}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Workflow (for multi-prompt) */}
                            {template.workflow && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Settings size={22} className="text-purple-600" />
                                        Workflow
                                    </h2>
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <p className="text-gray-600 mb-4">
                                            This is a multi-prompt agent that routes conversations to different specialists.
                                        </p>
                                        <div className="space-y-3">
                                            {template.workflow.specialists?.map((spec, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{spec.label}</div>
                                                        <div className="text-sm text-gray-600">{spec.objective}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Demo Audio */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
                                <h3 className="font-semibold text-gray-900 mb-4">Listen to a demo</h3>
                                <button
                                    onClick={handlePlayDemo}
                                    className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto hover:bg-indigo-700 transition-colors"
                                >
                                    <Play size={24} />
                                </button>
                                <p className="text-sm text-gray-500 mt-3">Sample conversation</p>
                            </div>

                            {/* Integrations */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-amber-500" />
                                    Required Integrations
                                </h3>
                                <div className="space-y-3">
                                    {requiredIntegrations.length > 0 ? (
                                        requiredIntegrations.map((int: string) => (
                                            <div key={int} className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span className="text-gray-700">{int}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No specific integrations required</p>
                                    )}
                                </div>
                            </div>

                            {/* Industries that use this */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-yellow-500" />
                                    Popular in
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                        {template.industryId.charAt(0).toUpperCase() + template.industryId.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* CTA */}
                            <Link
                                href={`/signup?template=${template.id}`}
                                className="block w-full py-4 px-6 bg-indigo-600 text-white text-center font-semibold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg"
                            >
                                Add to My Agent
                            </Link>
                            <p className="text-xs text-gray-500 text-center">
                                Sign up free and customize this template
                            </p>
                        </div>
                    </div>
                </div>

                {/* Related Templates */}
                {relatedTemplates.length > 0 && (
                    <div className="px-6 max-w-5xl mx-auto mt-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Templates</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {relatedTemplates.map((t) => (
                                <Link
                                    key={t.id}
                                    href={`/templates/${t.id}`}
                                    className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow"
                                >
                                    <h3 className="font-semibold text-gray-900 mb-2">{t.name}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{t.summary}</p>
                                    <span className="inline-flex items-center gap-1 text-indigo-600 text-sm mt-4">
                                        View details <ArrowRight size={14} />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
