"use client";

import { motion } from "framer-motion";
import { Zap, Globe, Brain, Cpu } from "lucide-react";

const capabilities = [
    {
        icon: Zap,
        title: "Instant setup",
        description: "Pick a template, configure, and go live in minutes. No infrastructure required.",
    },
    {
        icon: Globe,
        title: "Multi-language",
        description: "Support English, Hindi, Tamil, Telugu, and more with auto-detection.",
    },
    {
        icon: Brain,
        title: "Smart routing",
        description: "Automatically route conversations to the right specialist or handoff to humans.",
    },
    {
        icon: Cpu,
        title: "Knowledge base",
        description: "Upload docs and FAQs; your agents reference them automatically.",
    },
];

export default function Capabilities() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful, yet simple</h2>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Advanced AI capabilities that work out of the box.
                    </p>
                </motion.div>

                {/* Capabilities grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {capabilities.map((cap, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-sm transition-all"
                        >
                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                                <cap.icon size={28} className="text-gray-900" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{cap.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{cap.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
