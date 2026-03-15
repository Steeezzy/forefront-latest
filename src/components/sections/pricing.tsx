"use client";

import React, { useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Starter",
      price: billingCycle === "monthly" ? "50" : "40",
      description: "/month",
      features: [
        "3 Automated Workflows",
        "Basic AI Assistant Access",
        "Email + Slack Integration",
        "Monthly Performance Reports",
        "Email Support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: billingCycle === "monthly" ? "90" : "72",
      description: "/month",
      features: [
        "10+ Automated Workflows",
        "Advanced AI Assistant Features",
        "Bi-Weekly Strategy Reviews",
        "CRM + Marketing Tool Integrations",
        "Priority Support",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "",
      features: [
        "Unlimited Custom Workflows",
        "Dedicated AI Strategist",
        "API & Private Integrations",
        "Real-Time Performance Dashboards",
        "24/7 Premium Support + SLA",
      ],
      cta: "Get Started",
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="relative w-full py-[120px] bg-[#ffffff] overflow-hidden"
    >
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Section Header */}
        <motion.div 
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-white/[0.08] bg-white/[0.03]">
            <span className="text-[11px] font-medium tracking-[0.2em] text-gray-900/50 uppercase">
              Pricing
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-gray-900 mb-4">
            Flexible Plans for{" "}
            <span
              className="italic font-normal"
              style={{
                backgroundImage: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Everyone
            </span>
          </h2>
          
          <p className="text-gray-900/35 text-[15px] leading-relaxed max-w-lg mb-10">
            Choose a plan that fits your goals and scale as you grow
          </p>

          {/* Toggle */}
          <div className="flex items-center gap-4 p-1.5 bg-[rgba(22,23,29,0.5)] rounded-full border border-[rgba(255,255,255,0.08)]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-6 py-2 text-[14px] font-medium transition-all rounded-full",
                billingCycle === "monthly"
                  ? "bg-[#f9fafb] text-gray-900 shadow-lg"
                  : "text-[#999999] hover:text-gray-900"
              )}
            >
              Monthly
            </button>
            <div className="relative">
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-6 py-2 text-[14px] font-medium transition-all rounded-full flex items-center gap-2",
                  billingCycle === "yearly"
                    ? "bg-[#f9fafb] text-gray-900 shadow-lg"
                    : "text-[#999999] hover:text-gray-900"
                )}
              >
                Yearly
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-gray-900 font-semibold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "relative flex flex-col p-8 rounded-[16px] border transition-all duration-300 group",
                plan.popular 
                  ? "bg-[rgba(13,14,18,0.8)] border-[rgba(255,255,255,0.15)] shadow-[0_0_40px_-15px_rgba(27,38,59,0.5)]" 
                  : "bg-[rgba(13,14,18,0.4)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
              )}
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              {plan.popular && (
                <div className="absolute top-6 right-6">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-gray-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[12px] font-semibold text-gray-900">Popular</span>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-[18px] font-bold text-gray-900 mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[48px] font-bold text-gray-900 tracking-tight">
                    {plan.price !== "Custom" ? `$${plan.price}` : plan.price}
                  </span>
                  {plan.description && (
                    <span className="text-[16px] text-[#999999]">{plan.description}</span>
                  )}
                </div>
              </div>

              <a
                href="#"
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-4 rounded-xl text-[16px] font-semibold transition-all mb-10 border",
                  plan.popular
                    ? "bg-white text-[#ffffff] border-white hover:bg-[#e0e0e0]"
                    : "bg-transparent text-gray-900 border-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.04)]"
                )}
              >
                {plan.cta} <ArrowUpRight size={18} />
              </a>

              <div className="flex flex-col gap-4">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <div className="mt-1">
                      <Check size={16} className="text-[#999999]" />
                    </div>
                    <span className="text-[15px] text-[#999999] leading-tight">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {plan.popular && (
                <div className="absolute inset-0 rounded-[16px] pointer-events-none opacity-20 bg-gradient-to-b from-[#f3f4f6] to-transparent" />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[rgba(22,23,29,0.5)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="opacity-80"
            >
              <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
            </svg>
            <p className="text-[14px] text-[#999999]">
              We donate 2% of your membership to pediatric wellbeing
            </p>
          </div>
        </motion.div>
      </div>

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 -right-[20%] w-[500px] h-[500px] bg-[#f3f4f6] rounded-full blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 -left-[20%] w-[500px] h-[500px] bg-[#f3f4f6] rounded-full blur-[150px] opacity-10 pointer-events-none" />
    </section>
  );
};

export default PricingSection;
