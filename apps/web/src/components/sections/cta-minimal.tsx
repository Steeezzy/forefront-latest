"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Ready to transform your business?
                </h2>
                <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto">
                    Join thousands of companies using AI voice agents to handle calls, book appointments, and delight customers.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/templates"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors"
                    >
                        Get started free
                        <ArrowRight size={18} />
                    </Link>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-full hover:border-gray-400 transition-colors"
                    >
                        View pricing
                    </Link>
                </div>
            </div>
        </section>
    );
}
