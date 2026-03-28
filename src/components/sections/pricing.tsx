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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-gray-100 bg-gray-50">
            <span className="text-[11px] font-medium tracking-[0.2em] text-[#101728]/50 uppercase">
              Pricing Plan
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-[#101728] mb-4">
            Flexible Plans for{" "}
            <span className="italic font-normal text-gray-400">Everyone</span>
          </h2>
          
          <p className="text-gray-500 text-[15px] leading-relaxed max-w-lg mb-10">
            Choose a plan that fits your goals and scale as you grow
          </p>

          {/* Toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-full border border-gray-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-8 py-2.5 text-[14px] font-semibold transition-all rounded-full",
                billingCycle === "monthly"
                  ? "bg-[#101728] text-white shadow-lg"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-8 py-2.5 text-[14px] font-semibold transition-all rounded-full flex items-center gap-2",
                billingCycle === "yearly"
                  ? "bg-[#101728] text-white shadow-lg"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Yearly
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              )}>
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-300 group",
                plan.popular 
                  ? "bg-white border-[#101728] shadow-2xl shadow-gray-200" 
                  : "bg-white border-gray-100 hover:border-gray-200 shadow-xl shadow-gray-100/50"
              )}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#101728] text-white text-[12px] font-bold shadow-lg">
                    <span className="uppercase tracking-widest">Most Popular</span>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-[20px] font-bold text-[#101728] mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[48px] font-bold text-[#101728] tracking-tight">
                    {plan.price !== "Custom" ? `$${plan.price}` : plan.price}
                  </span>
                  {plan.description && (
                    <span className="text-[16px] text-gray-400 font-medium">{plan.description}</span>
                  )}
                </div>
              </div>

              <button
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-4 rounded-xl text-[16px] font-bold transition-all mb-10",
                  plan.popular
                    ? "bg-[#101728] text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20"
                    : "bg-gray-50 text-[#101728] border border-gray-200 hover:bg-gray-100"
                )}
              >
                {plan.cta} <ArrowUpRight size={18} />
              </button>

              <div className="flex flex-col gap-5">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <div className={cn(
                      "mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                      plan.popular ? "bg-[#101728]/10 text-[#101728]" : "bg-gray-100 text-gray-400"
                    )}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-[15px] text-gray-600 font-medium leading-tight">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          className="mt-20 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gray-50 border border-gray-100 backdrop-blur-sm shadow-sm">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#101728"
              strokeWidth="2.5"
              className="opacity-70"
            >
              <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
            </svg>
            <p className="text-[14px] text-gray-500 font-medium">
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
