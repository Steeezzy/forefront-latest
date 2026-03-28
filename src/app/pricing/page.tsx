"use client";

import Navbar from "@/components/sections/navbar";
import Footer from "@/components/sections/footer";
import { Check, Zap, Phone, MessageSquare, BarChart3, Bot, Headphones } from "lucide-react";

const PLANS = [
    {
        name: "Starter",
        price: "$99",
        period: "/month",
        minutes: 500,
        templates: "3 templates",
        integrations: "2 integrations",
        description: "Perfect for small teams getting started with AI voice agents.",
        features: [
            "500 minutes/month",
            "3 active voice agents",
            "3 templates included",
            "2 integrations (Google Calendar + 1 CRM)",
            "Basic analytics",
            "Email support",
        ],
        popular: false,
        cta: "Get Started",
    },
    {
        name: "Growth",
        price: "$299",
        period: "/month",
        minutes: 2000,
        templates: "8 templates",
        integrations: "5 integrations",
        description: "For growing businesses that need more capacity and features.",
        features: [
            "2,000 minutes/month",
            "8 active voice agents",
            "8 templates included",
            "5 integrations",
            "Advanced analytics",
            "Priority support",
            "SMS reminders",
            "Custom integrations",
        ],
        popular: true,
        cta: "Start Free Trial",
    },
    {
        name: "Pro",
        price: "$599",
        period: "/month",
        minutes: 5000,
        templates: "Unlimited",
        integrations: "Unlimited",
        description: "For established teams that want to scale voice automation.",
        features: [
            "5,000 minutes/month",
            "Unlimited voice agents",
            "All 30 templates",
            "Unlimited integrations",
            "Full analytics suite",
            "24/7 phone support",
            "Custom AI training",
            "API access",
            "White-label options",
        ],
        popular: false,
        cta: "Get Started",
    },
    {
        name: "Enterprise",
        price: "$1499+",
        period: "/month",
        minutes: "Unlimited",
        templates: "Unlimited + custom",
        integrations: "Unlimited",
        description: "Tailored solutions for large organizations with complex needs.",
        features: [
            "Unlimited minutes",
            "Unlimited everything",
            "Custom template development",
            "Dedicated account manager",
            "SLA guarantee",
            "On-premise deployment",
            "Custom integrations",
            "Security audit logs",
        ],
        popular: false,
        cta: "Contact Sales",
    },
];

const INTEGRATIONS = [
    { name: "Google Calendar", icon: "📅" },
    { name: "HubSpot", icon: "🔄" },
    { name: "Twilio", icon: "📞" },
    { name: "Stripe", icon: "💳" },
    { name: "SMS", icon: "💬" },
    { name: "Email", icon: "✉️" },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium mb-4">
                        <Zap size={12} />
                        Simple, transparent pricing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Choose the right plan for your business
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Start with a 14-day free trial. No credit card required. Scale as you grow.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-3xl p-8 border-2 transition-all duration-200 hover:scale-105 ${
                                plan.popular
                                    ? "border-indigo-600 shadow-xl shadow-indigo-200 relative bg-white"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-500">{plan.period}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">{plan.minutes} minutes/month</p>
                                <p className="text-xs text-gray-400">{plan.templates} • {plan.integrations}</p>
                            </div>

                            <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                                    plan.popular
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Overage Pricing */}
                <div className="bg-gray-50 rounded-3xl p-10 max-w-4xl mx-auto mb-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Overage Pricing</h2>
                    <p className="text-gray-600 text-center mb-8">
                        If you exceed your monthly minutes, you can purchase additional minutes at these rates:
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 text-center">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            <div className="text-2xl font-bold text-gray-900 mb-2">$0.12/min</div>
                            <div className="text-sm text-gray-500">Starter overage</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            <div className="text-2xl font-bold text-gray-900 mb-2">$0.15/min</div>
                            <div className="text-sm text-gray-500">Growth overage</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            <div className="text-2xl font-bold text-gray-900 mb-2">$0.18/min</div>
                            <div className="text-sm text-gray-500">Pro overage</div>
                        </div>
                    </div>
                </div>

                {/* Add-ons */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Add-ons</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { name: "Extra Phone #", price: "$5/mo each", desc: "Add additional numbers" },
                            { name: "Premium Voices", price: "+$49/mo", desc: "Access natural-sounding voices" },
                            { name: "Custom Template", price: "$299 one-time", desc: "Built for your use case" },
                            { name: "White Label", price: "+$500/mo", desc: "Remove Questron branding" },
                        ].map((addon) => (
                            <div key={addon.name} className="bg-white p-6 rounded-2xl border border-gray-200 text-center">
                                <h3 className="font-semibold text-gray-900 mb-1">{addon.name}</h3>
                                <div className="text-indigo-600 font-bold mb-2">{addon.price}</div>
                                <p className="text-xs text-gray-500">{addon.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integrations */}
                <div className="mt-24 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Works with your favorite tools</h2>
                    <p className="text-gray-600 mb-8">Connect to 20+ integrations to power your voice agent</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {INTEGRATIONS.map((int) => (
                            <div
                                key={int.name}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full"
                            >
                                <span>{int.icon}</span>
                                <span className="text-sm font-medium text-gray-700">{int.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ CTA */}
                <div className="mt-16 text-center">
                    <p className="text-gray-600 mb-4">Still have questions about pricing?</p>
                    <a href="/docs" className="text-indigo-600 font-medium hover:underline">
                        Visit our pricing FAQ →
                    </a>
                </div>
            </main>

            <Footer />
        </div>
    );
}
