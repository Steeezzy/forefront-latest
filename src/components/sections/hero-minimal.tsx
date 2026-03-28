"use client";

import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
                {/* Eyebrow */}
                <p className="text-sm font-medium text-gray-500 mb-6 tracking-wide uppercase">
                    AI Voice Agents for Modern Businesses
                </p>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                    Let AI handle your calls.
                    <br />
                    <span className="text-gray-400">Focus on what matters.</span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Deploy a voice agent in minutes. Book appointments, answer FAQs, and delight customers—24/7 without lifting a finger.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Link
                        href="/templates"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-gray-900 transition-colors"
                    >
                        Get started free
                        <ArrowRight size={18} />
                    </Link>
                    <button className="inline-flex items-center gap-2 px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-full hover:border-gray-400 transition-colors">
                        <Play size={18} />
                        Watch demo
                    </button>
                </div>

                {/* Social Proof */}
                <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        No credit card required
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Live in 5 minutes
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        24/7 support included
                    </div>
                </div>
            </div>
        </section>
    );
}
