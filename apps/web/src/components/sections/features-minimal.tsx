"use client";

import { Zap, Clock, BarChart3, Shield } from "lucide-react";

const features = [
    {
        icon: Zap,
        title: "Instant deployment",
        description: "Pick a template, configure your business details, and go live. No coding, no infrastructure headaches.",
    },
    {
        icon: Clock,
        title: "Always on",
        description: "Your AI agent works 24/7, never misses a call, and handles unlimited conversations simultaneously.",
    },
    {
        icon: BarChart3,
        title: "Full visibility",
        description: "Track call volumes, outcomes, and customer sentiment from a clean, simple dashboard.",
    },
    {
        icon: Shield,
        title: "Enterprise ready",
        description: "SOC2 compliant, data encrypted, and supports HIPAA use cases out of the box.",
    },
];

export default function Features() {
    return (
        <section className="py-24 px-6 bg-gray-50/50">
            <div className="max-w-6xl mx-auto">
                {/* Section header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Everything you need
                    </h2>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Powerful features that just work, without the complexity.
                    </p>
                </div>

                {/* Features grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="space-y-4">
                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                                <feature.icon size={24} className="text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
