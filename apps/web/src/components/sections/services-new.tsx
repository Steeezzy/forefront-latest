"use client";

import { motion } from "framer-motion";
import { MessageSquare, Phone, Settings, BarChart3 } from "lucide-react";

const services = [
    {
        icon: MessageSquare,
        title: "Website Chat Agents",
        description: "AI assistants that answer questions, qualify leads, and capture information via embedded chat widgets on your site.",
        features: [
            "24/7 automated responses",
            "CRM and form integrations",
            "Human handoff when needed",
            "Custom branding",
        ],
    },
    {
        icon: Phone,
        title: "Voice Call Agents",
        description: "AI voice agents that handle phone calls naturally—booking appointments, providing support, and making outbound calls.",
        features: [
            "Natural voice conversations",
            "Sarvam TTS/STT included",
            "Inbound & outbound calling",
            "Call recordings & transcripts",
        ],
    },
    {
        icon: Settings,
        title: "One Platform",
        description: "Manage both chat and voice agents from the same dashboard, using the same templates and configuration workflow.",
        features: [
            "Unified agent builder",
            "Shared knowledge base",
            "Cross-channel analytics",
            "Single billing & support",
        ],
    },
    {
        icon: BarChart3,
        title: "Full Visibility",
        description: "Track performance across all channels with comprehensive dashboards, transcript logs, and outcome reports.",
        features: [
            "Real-time monitoring",
            "Conversation analytics",
            "Integration health status",
            "Exportable reports",
        ],
    },
];

export default function Services() {
    return (
        <section className="py-24 px-6 bg-gray-50/50">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Two channels, one platform</h2>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Whether your customers prefer to type or talk, we've got you covered.
                    </p>
                </motion.div>

                {/* Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <service.icon size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                                </div>
                            </div>

                            <ul className="space-y-2 mt-4">
                                {service.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
