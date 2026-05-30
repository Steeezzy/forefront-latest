"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageSquare, Phone } from "lucide-react";
import { AGENT_TEMPLATES, INDUSTRIES } from "@/components/voice-agents/template-data";

export default function Templates() {
    const featured = AGENT_TEMPLATES.slice(0, 6);

    return (
        <section className="py-24 px-6 bg-gray-50/50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4"
                >
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Start with a template</h2>
                        <p className="text-gray-600">
                            All templates work for both chat and voice. Choose your industry, configure, and deploy.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-gray-200 rounded-full text-sm text-gray-600">
                            <MessageSquare size={14} /> Chat
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-gray-200 rounded-full text-sm text-gray-600">
                            <Phone size={14} /> Voice
                        </span>
                    </div>
                </motion.div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featured.map((template, index) => {
                        const industry = INDUSTRIES.find(i => i.id === template.industryId) || INDUSTRIES[0];
                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                                whileHover={{ y: -4 }}
                            >
                                <Link
                                    href={`/templates/${template.id}`}
                                    className="block h-full p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                                >
                                    {/* Industry + name */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">
                                                {industry.label}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                                        </div>
                                        <ArrowRight size={18} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>

                                    {/* Summary */}
                                    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2">
                                        {template.summary}
                                    </p>

                                    {/* First message preview */}
                                    <div className="bg-gray-50 p-4 rounded-xl mb-6">
                                        <p className="text-xs text-gray-500 mb-1">Opening line:</p>
                                        <p className="text-sm text-gray-800 italic line-clamp-2">
                                            &ldquo;{template.firstMessage}&rdquo;
                                        </p>
                                    </div>

                                    {/* Meta tags */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md capitalize">
                                            {template.direction}
                                        </span>
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                                            {template.mode === 'multi' ? 'Multi-prompt' : 'Single-prompt'}
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* View all */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-10"
                >
                    <Link
                        href="/templates"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors"
                    >
                        View all templates
                        <ArrowRight size={16} />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
