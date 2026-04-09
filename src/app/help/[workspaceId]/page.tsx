"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Clock3, Globe2, MessageSquareText, Phone, Sparkles } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { INDUSTRY_CONFIGS } from "@/data/auto-config";

type WorkspaceRecord = {
    id: string;
    name?: string;
    business_name?: string;
    industry_id?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    config?: Record<string, any> | string | null;
};

function normalizeConfig(config: WorkspaceRecord["config"]): Record<string, any> {
    if (!config) {
        return {};
    }

    if (typeof config === "string") {
        try {
            return JSON.parse(config);
        } catch {
            return {};
        }
    }

    return config;
}

function formatHours(config: Record<string, any>): string {
    const hours = config.business_hours;
    if (hours?.start && hours?.end) {
        return `${hours.start} to ${hours.end}`;
    }

    return "9:00 to 18:00";
}

export default function HelpCenterPage() {
    const params = useParams<{ workspaceId: string }>();
    const workspaceId = params.workspaceId;
    const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchWorkspace() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(buildProxyUrl(`/api/workspace/${workspaceId}`), {
                    credentials: "include",
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error || "Workspace not found");
                }

                setWorkspace(data);
            } catch (nextError: any) {
                setError(nextError.message || "Workspace not found");
            } finally {
                setLoading(false);
            }
        }

        if (workspaceId) {
            void fetchWorkspace();
        }
    }, [workspaceId]);

    const config = useMemo(() => normalizeConfig(workspace?.config), [workspace?.config]);
    const industryConfig = workspace?.industry_id ? INDUSTRY_CONFIGS[workspace.industry_id] : null;
    const businessName = workspace?.business_name || workspace?.name || "Questron Workspace";
    const greeting = config.greeting || config.chatbot_welcome || industryConfig?.greeting || "How can we help today?";

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f7f7f4] px-6 py-24 text-center text-sm text-gray-500">
                Loading help center...
            </div>
        );
    }

    if (error || !workspace) {
        return (
            <div className="min-h-screen bg-[#f7f7f4] px-6 py-24">
                <div className="mx-auto max-w-2xl rounded-[32px] border border-gray-200 bg-white p-10 text-center shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Unavailable</div>
                    <h1 className="mt-4 text-3xl font-semibold text-gray-900">Help center not found</h1>
                    <p className="mt-3 text-sm text-gray-500">{error || "This workspace does not have a public help center yet."}</p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Back to Homepage
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f7f4] text-gray-900">
            <section className="overflow-hidden border-b border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(180deg,_#ffffff_0%,_#f7f7f4_100%)]">
                <div className="mx-auto max-w-6xl px-6 py-20">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-end">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                <Sparkles size={13} />
                                Help Center
                            </div>
                            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-gray-900 md:text-5xl">
                                Support for {businessName}
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
                                {greeting}
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
                                    <Clock3 size={15} className="text-gray-500" />
                                    Hours: {formatHours(config)}
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
                                    <Globe2 size={15} className="text-gray-500" />
                                    {workspace.language || industryConfig?.language || "en-IN"} · {workspace.timezone || "Asia/Kolkata"}
                                </div>
                                {workspace.phone ? (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
                                        <Phone size={15} className="text-gray-500" />
                                        {workspace.phone}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Quick Actions</div>
                            <div className="mt-5 space-y-3">
                                {[
                                    {
                                        title: "Call the team",
                                        body: workspace.phone || "Add a workspace phone number to expose direct support contact.",
                                        icon: Phone,
                                    },
                                    {
                                        title: "Operating hours",
                                        body: `${formatHours(config)} in ${workspace.timezone || "Asia/Kolkata"}.`,
                                        icon: Clock3,
                                    },
                                    {
                                        title: "Chat support",
                                        body: "Use your Questron chat widget or connected inbox channels for real-time help.",
                                        icon: MessageSquareText,
                                    },
                                ].map((item) => (
                                    <div key={item.title} className="rounded-2xl border border-gray-200 bg-[#fafaf8] p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <item.icon size={15} className="text-emerald-600" />
                                            {item.title}
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-gray-600">{item.body}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-16">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
                    <div className="rounded-[30px] border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Frequently Asked Questions</div>
                        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Popular answers</h2>
                        <div className="mt-6 space-y-4">
                            {(industryConfig?.sampleFAQs || []).map((faq) => (
                                <article key={faq.question} className="rounded-2xl border border-gray-200 bg-[#fcfcfb] p-5">
                                    <h3 className="text-base font-semibold text-gray-900">{faq.question}</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-600">{faq.answer}</p>
                                </article>
                            ))}
                            {!industryConfig?.sampleFAQs?.length ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafaf8] p-6 text-sm text-gray-500">
                                    This workspace has not published FAQ content yet. Add an industry template or knowledge base to populate this help center automatically.
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <aside className="rounded-[30px] border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">What this assistant handles</div>
                        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Capabilities</h2>
                        <div className="mt-6 space-y-3">
                            {(industryConfig?.features || [
                                "Answer common questions",
                                "Route support to the right team",
                                "Capture customer details",
                            ]).map((feature) => (
                                <div key={feature} className="rounded-2xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700">
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 rounded-2xl bg-gray-900 p-5 text-white">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Powered by Questron</div>
                            <p className="mt-3 text-sm leading-6 text-white/80">
                                This public help center mirrors the workspace profile, operating hours, and seeded FAQ knowledge so teams can share a support link instantly.
                            </p>
                            <Link
                                href="/pricing"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white underline-offset-4 hover:underline"
                            >
                                Explore Questron pricing
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}
