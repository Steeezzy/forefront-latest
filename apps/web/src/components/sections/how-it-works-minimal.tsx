"use client";

import { ArrowRight, SquarePlay } from "lucide-react";
import Link from "next/link";

const steps = [
    {
        number: "1",
        title: "Choose a template",
        description: "Pick from 30+ industry-specific blueprints. Each comes with pre-written prompts and workflows.",
    },
    {
        number: "2",
        title: "Customize it",
        description: "Add your business details, services, hours, and integrations. No code required.",
    },
    {
        number: "3",
        title: "Go live",
        description: "Deploy instantly. Forward calls to your agent and start monitoring from your dashboard.",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">How it works</h2>
                    <p className="text-gray-600">
                        From zero to your first AI call in under 5 minutes.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connector line */}
                    <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gray-200" />

                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            {/* Number */}
                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6 mx-auto">
                                <span className="text-2xl font-bold text-gray-900">{step.number}</span>
                            </div>

                            {/* Content */}
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Demo video placeholder */}
                <div className="mt-16 flex justify-center">
                    <div className="w-full max-w-3xl aspect-video bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center group cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <SquarePlay size={28} className="text-gray-900" />
                            </div>
                            <span className="text-sm text-gray-600">Watch 2-minute demo</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
