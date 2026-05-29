"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageSquare, Phone } from "lucide-react";

export default function CTA() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-gray-900 rounded-3xl p-12 md:p-16 text-center text-white"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to build your AI team?
                    </h2>
                    <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
                        Deploy chat and voice agents in minutes. Handle every conversation, on every channel.
                    </p>

                    {/* Channel badges */}
                    <div className="flex justify-center gap-4 mb-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full"
                        >
                            <MessageSquare size={18} />
                            Website Chat
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full"
                        >
                            <Phone size={18} />
                            Phone Calls
                        </motion.div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-medium rounded-full hover:bg-gray-100 transition-colors hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Get started free
                            <ArrowRight size={18} />
                        </Link>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-colors"
                        >
                            See pricing
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
