"use client";

import Link from "next/link";
import { Check } from "lucide-react";

const tiers = [
    {
        name: "Starter",
        price: "$19",
        period: "/month",
        description: "Perfect for testing the waters.",
        features: [
            "1 voice agent",
            "100 minutes/month",
            "Basic analytics",
            "Email support",
        ],
        cta: "Start free trial",
        popular: false,
    },
    {
        name: "Growth",
        price: "$49",
        period: "/month",
        description: "For growing businesses.",
        features: [
            "3 voice agents",
            "500 minutes/month",
            "Advanced analytics",
            "Priority support",
            "Integrations (Google Calendar, SMS)",
        ],
        cta: "Start free trial",
        popular: true,
    },
    {
        name: "Pro",
        price: "$99",
        period: "/month",
        description: "For teams and automation.",
        features: [
            "Unlimited voice agents",
            "2000 minutes/month",
            "Custom reporting",
            "24/7 phone support",
            "All integrations",
            "API access",
        ],
        cta: "Start free trial",
        popular: false,
    },
];

export default function Pricing() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Simple pricing</h2>
                    <p className="text-gray-600">
                        Choose the plan that fits your needs. All plans include a 14-day free trial.
                    </p>
                </div>

                {/* Tiers */}
                <div className="grid md:grid-cols-3 gap-8">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative p-8 rounded-2xl border ${
                                tier.popular
                                    ? "border-gray-900 shadow-lg"
                                    : "border-gray-200"
                            } bg-white`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                                    Most popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                                    <span className="text-gray-500">{tier.period}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{tier.description}</p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/signup"
                                className={`block w-full py-3 text-center rounded-xl font-medium transition-colors ${
                                    tier.popular
                                        ? "bg-gray-900 text-white hover:bg-gray-800"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                }`}
                            >
                                {tier.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Overage note */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    Overage beyond plan minutes: $0.10/minute. All plans include unlimited recordings storage.
                </p>
            </div>
        </section>
    );
}
