"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { INDUSTRIES } from "@/components/voice-agents/template-data";
import { ArrowRight, Star } from "lucide-react";

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

export default function NicheShowcase() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const featuredIndustries = useMemo(() => {
        // Show a curated subset (or all if fewer)
        return INDUSTRIES.slice(0, 8);
    }, []);

    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center max-w-3xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Built for Every Industry
                    </h2>
                    <p className="text-lg text-gray-600">
                        Whether you run a clinic, restaurant, or service business, we have a pre-built agent for you.
                    </p>
                </motion.div>

                {/* Industry Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {featuredIndustries.map((industry) => {
                        const icon = INDUSTRY_ICONS[industry.id] || FALLBACK_ICONS[industry.id] || "🤖";
                        const isHovered = hoveredId === industry.id;

                        return (
                            <motion.a
                                key={industry.id}
                                href={`/industries#${industry.id}`}
                                layoutId={`industry-${industry.id}`}
                                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                                    isHovered
                                        ? "border-indigo-500 shadow-xl bg-white z-10"
                                        : "border-transparent bg-white/50 hover:bg-white"
                                }`}
                                onHoverStart={() => setHoveredId(industry.id)}
                                onHoverEnd={() => setHoveredId(null)}
                                whileHover={{ scale: 1.03 }}
                            >
                                <div className="flex flex-col items-center text-center gap-4">
                                    <span className="text-4xl">{icon}</span>
                                    <h3 className="font-semibold text-gray-900">{industry.label}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{industry.description}</p>
                                </div>

                                {/* Hover overlay */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`} />

                                {/* Arrow indicator */}
                                <div className={`absolute top-4 right-4 transition-transform ${isHovered ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"}`}>
                                    <ArrowRight size={18} className="text-indigo-600" />
                                </div>
                            </motion.a>
                        );
                    })}
                </div>

                {/* CTA */}
                <motion.div
                    className="text-center mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <a
                        href="/industries"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        Explore All Industries
                        <ArrowRight size={18} />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
