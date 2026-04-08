"use client";

import Navbar from "@/components/sections/navbar";
import Footer from "@/components/sections/footer";
import { Check, Zap, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    }
];

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
};

export default function PricingPage() {
    const router = useRouter();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [interval, setInterval] = useState<"month" | "year">("month");

    // Monthly pricing (from existing)
    const prices = {
        free: { month: 0, year: 0 },
        starter: { month: 8200, year: 82000 }, // 10 months for annual
        growth: { month: 24900, year: 249000 },
        pro: { month: 49900, year: 499000 }
    };

    const handleCheckout = async (planId: string) => {
        if (planId === "free") {
            router.push("/sign-up");
            return;
        }

        if (planId === "pro") {
            window.location.href = "mailto:sales@qestron.com";
            return;
        }

        try {
            setLoadingPlan(planId);
            const token = localStorage.getItem("token"); // Wait, they might be logged out...
            
            if (!token) {
                // If not logged in, redirect to sign up with plan intent
                localStorage.setItem("intended_plan", planId);
                router.push("/sign-up");
                return;
            }

            const res = await fetch("http://localhost:8000/api/billing/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    planId,
                    interval
                })
            });

            const data = await res.json();
            
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Checkout failed. Please try again or contact support.");
        } finally {
            setLoadingPlan(null);
        }
    };

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
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        Start free. Upgrade when you need more. All prices in INR. No hidden fees.
                    </p>

                    {/* Toggle Switch */}
                    <div className="flex items-center justify-center gap-3">
                        <span className={`text-sm font-medium ${interval === "month" ? "text-gray-900" : "text-gray-500"}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setInterval(interval === "month" ? "year" : "month")}
                            className="relative w-14 h-8 bg-gray-900 rounded-full transition-colors flex items-center px-1"
                        >
                            <div
                                className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                                    interval === "year" ? "translate-x-6" : ""
                                }`}
                            />
                        </button>
                        <span className={`text-sm font-medium flex items-center gap-1.5 ${interval === "year" ? "text-gray-900" : "text-gray-500"}`}>
                            Annual
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                                Save 20%
                            </span>
                        </span>
                    </div>
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
                                    <span className="text-4xl font-bold text-gray-900">
                                        {formatPrice(prices[plan.planId as keyof typeof prices][interval])}
                                    </span>
                                    <span className="text-gray-500">/{interval === 'month' ? 'mo' : 'yr'}</span>
                                </div>
                                {interval === 'year' && plan.planId !== 'free' && (
                                    <p className="text-sm text-emerald-600 font-medium mt-2">
                                        Includes 2 months free!
                                    </p>
                                )}
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
                                onClick={() => handleCheckout(plan.planId)}
                                disabled={loadingPlan === plan.planId}
                                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                    plan.popular
                                        ? "bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-70"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-70"
                                }`}
                            >
                                {loadingPlan === plan.planId ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    plan.cta
                                )}
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
