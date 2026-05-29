"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Settings, Rocket } from "lucide-react";

const steps = [
    {
        icon: Layers,
        title: "1. Pick a Template",
        description: "Choose from 30+ industry-specific voice agent blueprints. Each template is pre-configured for your use case.",
        color: "from-blue-500 to-cyan-500",
    },
    {
        icon: Settings,
        title: "2. Configure",
        description: "Customize the agent with your business details, services, hours, and integrations. No code required.",
        color: "from-purple-500 to-pink-500",
    },
    {
        icon: Rocket,
        title: "3. Deploy & Manage",
        description: "Go live instantly. Forward calls to your agent, track performance, and iterate from the dashboard.",
        color: "from-orange-500 to-amber-500",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-white">
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
                        How It Works
                    </h2>
                    <p className="text-lg text-gray-600">
                        Three simple steps to get your AI voice agent up and running.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            className="relative flex flex-col items-center text-center"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                        >
                            {/* Connector line (hidden on mobile) */}
                            {index < steps.length - 1 && (
                                <div className="absolute top-16 left-[60%] w-[80%] h-0.5 bg-gray-200 hidden md:block" />
                            )}

                            {/* Icon */}
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                                <step.icon size={36} className="text-white" />
                            </div>

                            {/* Number badge */}
                            <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                {index + 1}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
