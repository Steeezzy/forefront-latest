"use client";

import { useMemo } from "react";
import Navbar from "@/components/sections/navbar";
import Footer from "@/components/sections/footer";
import { INDUSTRIES, AGENT_TEMPLATES, getAllIndustryTemplates } from "@/components/voice-agents/template-data";
import {
    ArrowRight,
    Check,
    Star,
} from "lucide-react";
import Link from "next/link";

const DIRECTION_LABELS: Record<string, string> = {
    outbound: "Outbound",
    inbound: "Inbound",
    webcall: "Webcall",
};

const INDUSTRY_ICONS: Record<string, string> = {
    blank: "🤖",
    logistics: "📦",
    healthcare: "🩺",
    financial: "💳",
    education: "🎓",
    hr: "👥",
    ecommerce: "🛍️",
    realestate: "🏠",
    automotive: "🚗",
    travel: "✈️",
    hospitality: "🏨",
};

// Fallback industries without icon in mapping
const FALLBACK_ICONS: Record<string, string> = {
    salon: "💇",
    plumbing: "🔧",
    hotel: "🏨",
    restaurant: "🍽️",
    fitness: "🏋️",
    veterinary: "🐾",
    law: "⚖️",
    insurance: "🛡️",
    driving: "🚙",
    cleaning: "🧹",
    events: "🎉",
    itsupport: "💻",
    funeral: "🌹",
    recruitment: "👥",
    retail: "🛍️",
};

const DIRECTION_LABELS: Record<string, string> = {
    inbound: "Inbound",
    outbound: "Outbound",
    webcall: "Webcall",
};

export default function IndustriesPage() {
    // Use static data
    const industries = INDUSTRIES;

    // Group templates by industry
    const templatesByIndustry = useMemo(() => {
        const map: Record<string, typeof AGENT_TEMPLATES> = {};
        AGENT_TEMPLATES.forEach((tpl) => {
            if (!map[tpl.industryId]) {
                map[tpl.industryId] = [];
            }
            map[tpl.industryId].push(tpl);
        });
        return map;
    }, []);

    // Industry-specific content generator (based on templates)
    const getIndustryContent = (industryId: string, templates: typeof AGENT_TEMPLATES) => {
        const hasBooking = templates.some((t) => t.summary.toLowerCase().includes("book") || t.summary.toLowerCase().includes("schedule"));
        const hasFAQ = templates.some((t) => t.summary.toLowerCase().includes("answer") || t.summary.toLowerCase().includes("questions"));
        const hasReminder = templates.some((t) => t.name.toLowerCase().includes("reminder"));
        const hasTriage = templates.some((t) => t.summary.toLowerCase().includes("urgent") || t.summary.toLowerCase().includes("triage"));
        const hasLeadCapture = templates.some((t) => t.summary.toLowerCase().includes("capture") || t.summary.toLowerCase().includes("qualify"));

        const capabilities: string[] = [];
        if (hasBooking) capabilities.push("Books appointments 24/7");
        if (hasFAQ) capabilities.push("Answers common questions instantly");
        if (hasReminder) capabilities.push("Sends automated reminders");
        if (hasTriage) capabilities.push("Classifies urgent calls");
        if (hasLeadCapture) capabilities.push("Captures and qualifies leads");
        if (capabilities.length === 0) capabilities.push("Handles calls intelligently");

        return capabilities;
    };

    // Get typical integrations based on industry
    const getIndustryIntegrations = (industryId: string): string[] => {
        const base = ["Google Calendar", "SMS", "Email"];
        if (["healthcare", "hospitality", "education"].includes(industryId)) {
            return [...base, "HubSpot", "Stripe"];
        }
        if (["automotive", "logistics", "cleaning"].includes(industryId)) {
            return [...base, "ServiceTitan", "Jobber"];
        }
        if (["realestate", "law", "insurance"].includes(industryId)) {
            return [...base, "Salesforce", "DocuSign"];
        }
        return base;
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Voice Agents for Every Industry
                    </h1>
                    <p className="text-lg text-gray-600">
                        Pre-configured AI agents designed for your specific business needs.
                        Pick your industry and go live in minutes.
                    </p>
                </div>

                {/* Industries List */}
                <div className="space-y-16">
                    {industries.map((industry) => {
                        const templates = templatesByIndustry[industry.id] || [];
                        const capabilities = getIndustryContent(industry.id, templates);
                        const integrations = getIndustryIntegrations(industry.id);
                        const icon = INDUSTRY_ICONS[industry.id] || FALLBACK_ICONS[industry.id] || "🤖";

                        // Select 2-3 key templates to showcase
                        const showcasedTemplates = templates.slice(0, 3);
                        const allTemplatesCount = templates.length;

                        if (templates.length === 0) {
                            // Skip industries with no templates
                            return null;
                        }

                        return (
                            <section
                                key={industry.id}
                                id={industry.id}
                                className="scroll-mt-24"
                            >
                                <div className="grid md:grid-cols-2 gap-12 items-center">
                                    {/* Left: Description */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-4xl">{icon}</span>
                                            <h2 className="text-3xl font-bold text-gray-900">
                                                {industry.label}
                                            </h2>
                                        </div>

                                        <p className="text-gray-600 mb-6 leading-relaxed">
                                            {industry.description}
                                        </p>

                                        <div className="space-y-3 mb-8">
                                            {capabilities.map((cap, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-700">{cap}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Integrations */}
                                        <div className="mb-6">
                                            <p className="text-sm font-medium text-gray-500 mb-2">Seamless integrations</p>
                                            <div className="flex flex-wrap gap-2">
                                                {integrations.map((int) => (
                                                    <span
                                                        key={int}
                                                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                                    >
                                                        {int}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Link
                                                href={`/templates?industry=${industry.id}`}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                                            >
                                                View all {allTemplatesCount} templates
                                                <ArrowRight size={18} />
                                            </Link>
                                            <Link
                                                href={`/signup?industry=${industry.id}`}
                                                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                                            >
                                                Get Started
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Right: Template Cards */}
                                    <div className="space-y-4">
                                        {showcasedTemplates.length > 0 ? (
                                            showcasedTemplates.map((tpl) => (
                                                <div
                                                    key={tpl.id}
                                                    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="font-semibold text-gray-900">
                                                            {tpl.name}
                                                        </div>
                                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md">
                                                            {DIRECTION_LABELS[tpl.direction]}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                        {tpl.summary}
                                                    </p>
                                                    <p className="text-xs text-gray-500 italic mb-4">
                                                        &ldquo;{tpl.firstMessage}&rdquo;
                                                    </p>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {tpl.variables.slice(0, 3).map((v) => (
                                                            <span
                                                                key={v}
                                                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono"
                                                            >
                                                                {'{' + v + '}'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50 rounded-2xl">
                                                <p className="text-gray-500">No templates yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* CTA Banner */}
                <div className="mt-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to transform your customer experience?</h2>
                    <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of businesses using AI voice agents to handle calls, book appointments, and delight customers 24/7.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/signup"
                            className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            Start Free Trial
                        </Link>
                        <Link
                            href="/templates"
                            className="px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Explore Templates
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
