"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowRight, MessageSquare, Phone, Settings, Check } from "lucide-react";

const steps = [
    {
        number: "01",
        title: "Pick a template",
        description: "Choose from 30+ industry-specific blueprints. All templates work for both chat and voice—you decide at deployment.",
    },
    {
        number: "02",
        title: "Configure",
        description: "Add your business details, services, hours, and integrations. Choose voice model and enable chat widget as needed.",
    },
    {
        number: "03",
        title: "Deploy",
        description: "Go live instantly. Embed chat on your site or forward phone calls to your agent. Monitor and iterate from your dashboard.",
    },
];

const modalities = [
    { id: "both", label: "Both" },
    { id: "chat", label: "Chat only" },
    { id: "voice", label: "Voice only" },
];

export default function HowItWorks() {
    const [activeModality, setActiveModality] = useState("both");

    return (
        <section id="how-it-works" className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        From zero to your first AI call or chat in under 5 minutes.
                    </p>
                </motion.div>

                {/* Modality toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex justify-center gap-2 mb-12"
                >
                    {modalities.map((mod) => (
                        <button
                            key={mod.id}
                            onClick={() => setActiveModality(mod.id)}
                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                                activeModality === mod.id
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {mod.label}
                        </button>
                    ))}
                </motion.div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connector line */}
                    <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gray-200" />

                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            {/* Number */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.15 }}
                                className="w-24 h-24 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center mb-6 mx-auto shadow-sm"
                            >
                                <span className="text-2xl font-bold text-gray-900">{step.number}</span>
                            </motion.div>

                            {/* Content */}
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modality-specific note */}
                <AnimatePresence mode="wait">
                    {activeModality === "both" && (
                        <motion.div
                            key="both"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-12 max-w-2xl mx-auto bg-gray-50 p-6 rounded-2xl border border-gray-200"
                        >
                            <p className="text-gray-700 text-sm leading-relaxed text-center">
                                <strong>Same agent, two channels.</strong> Create one agent that can handle both chat and calls.
                                Toggle which channels are enabled, and the same AI brain serves both.
                            </p>
                        </motion.div>
                    )}
                    {activeModality === "chat" && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-12 max-w-2xl mx-auto bg-blue-50 p-6 rounded-2xl border border-blue-100"
                        >
                            <p className="text-blue-900 text-sm leading-relaxed text-center">
                                <MessageSquare size={16} className="inline mr-1" />
                                <strong>Chat-only agents.</strong> Perfect for website support and lead capture. No voice required.
                            </p>
                        </motion.div>
                    )}
                    {activeModality === "voice" && (
                        <motion.div
                            key="voice"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-12 max-w-2xl mx-auto bg-purple-50 p-6 rounded-2xl border border-purple-100"
                        >
                            <p className="text-purple-900 text-sm leading-relaxed text-center">
                                <Phone size={16} className="inline mr-1" />
                                <strong>Voice-only agents.</strong> Handle phone calls with natural speech using Sarvam&apos;s AI voices.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-16"
                >
                    <a
                        href="/templates"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors"
                    >
                        Start building
                        <ArrowRight size={18} />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
