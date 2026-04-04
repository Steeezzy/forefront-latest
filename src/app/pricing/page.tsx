"use client";

import Navbar from "@/components/sections/navbar";
import Footer from "@/components/sections/footer";
import { Check, Zap, Star } from "lucide-react";

const PLANS = [
    {
        name: "Free",
        price: "₹0",
        period: "/month",
        description: "Get started with basic AI support.",
        features: [
            "1 AI Agent",
            "30 voice minutes/mo",
            "500 chat messages/mo",
            "1 campaign",
            "3 knowledge sources",
            "100 contacts",
            "Community support",
        ],
        popular: false,
        cta: "Get Started Free",
        planId: "free",
    },
    {
        name: "Starter",
        price: "₹8,200",
        period: "/month",
        description: "Perfect for small businesses getting started with AI.",
        features: [
            "3 AI Agents",
            "300 voice minutes/mo",
            "5,000 chat messages/mo",
            "10 campaigns/mo",
            "10 knowledge sources",
            "1,000 contacts",
            "Email support",
            "Basic analytics",
        ],
        popular: false,
        cta: "Start Free Trial",
        planId: "starter",
    },
    {
        name: "Growth",
        price: "₹24,900",
        period: "/month",
        description: "For growing businesses that need serious AI automation.",
        features: [
            "10 AI Agents",
            "1,000 voice minutes/mo",
            "25,000 chat messages/mo",
            "50 campaigns/mo",
            "50 knowledge sources",
            "10,000 contacts",
            "Priority support",
            "Advanced analytics",
            "CRM & pipeline",
            "Invoicing",
        ],
        popular: true,
        cta: "Start Free Trial",
        planId: "growth",
    },
    {
        name: "Pro",
        price: "₹49,900",
        period: "/month",
        description: "For enterprises that want unlimited AI power.",
        features: [
            "Up to 50 AI Agents",
            "5,000 voice minutes/mo",
            "100,000 chat messages/mo",
            "200 campaigns/mo",
            "200 knowledge sources",
            "50,000 contacts",
            "Dedicated support",
            "AI insights & reports",
            "Full CRM & invoicing",
            "Custom integrations",
            "API access",
        ],
        popular: false,
        cta: "Contact Sales",
        planId: "pro",
    },
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
                        Plans built for Indian SMBs
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Start free. Upgrade when you need more. All prices in INR. No hidden fees.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-3xl p-8 border-2 transition-all duration-200 hover:scale-[1.02] ${
                                plan.popular
                                    ? "border-gray-900 shadow-xl shadow-gray-200 relative bg-white"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                                    <Star size={10} fill="currentColor" />
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-500">{plan.period}</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                                    plan.popular
                                        ? "bg-gray-900 text-white hover:bg-gray-800"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Feature comparison */}
                <div className="bg-gray-50 rounded-3xl p-10 max-w-4xl mx-auto mb-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">All Plans Include</h2>
                    <div className="grid md:grid-cols-3 gap-6 text-center">
                        {[
                            { label: "Sarvam AI Powered", desc: "22 Indian languages supported" },
                            { label: "Voice + Chat + SMS", desc: "Multi-channel AI agents" },
                            { label: "No Setup Fee", desc: "Get started in under 5 minutes" },
                        ].map((item) => (
                            <div key={item.label} className="bg-white p-6 rounded-2xl border border-gray-200">
                                <div className="font-semibold text-gray-900 mb-1">{item.label}</div>
                                <div className="text-sm text-gray-500">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ CTA */}
                <div className="mt-16 text-center">
                    <p className="text-gray-600 mb-4">Need a custom enterprise plan?</p>
                    <a href="/docs" className="text-gray-900 font-semibold hover:underline">
                        Contact our sales team →
                    </a>
                </div>
            </main>

            <Footer />
        </div>
    );
}
