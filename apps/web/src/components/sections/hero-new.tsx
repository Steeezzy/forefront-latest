"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="pt-32 pb-20 px-6 overflow-hidden">
            <div className="max-w-5xl mx-auto">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-center mb-8"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        AI Agents for Chat & Voice
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-center text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
                >
                    One platform.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        Infinite conversations.
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                    Build and deploy AI agents that handle both text chat and voice calls.
                    Same platform, same templates, unlimited possibilities.
                </motion.p>

                {/* Dual service icons */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex justify-center gap-8 mb-12"
                >
                    <div className="flex items-center gap-2 text-gray-500">
                        <MessageSquare size={20} />
                        <span className="text-sm font-medium">Website Chat</span>
                    </div>
                    <div className="w-px h-6 bg-gray-300" />
                    <div className="flex items-center gap-2 text-gray-500">
                        <Phone size={20} />
                        <span className="text-sm font-medium">Phone Calls</span>
                    </div>
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        href="/templates"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Explore templates
                        <ArrowRight size={18} />
                    </Link>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-full hover:border-gray-400 transition-all"
                    >
                        View pricing
                    </Link>
                </motion.div>

                {/* Social proof line */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-center text-sm text-gray-500 mt-8"
                >
                    No credit card required • 14-day free trial • Cancel anytime
                </motion.p>
            </div>
        </section>
    );
}
