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
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const }
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
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="relative w-full py-24 bg-[#fafbfc] overflow-hidden"
    >
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Section Header */}
        <motion.div 
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[#e2e8f0] bg-white">
            <span className="text-[11px] font-medium tracking-wide text-[#64748b] uppercase">
              Pricing Plan
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0a192f] mb-4">
            Simple, Transparent <span className="italic font-normal text-[#94a3b8]">Pricing</span>
          </h2>
          
          <p className="text-[#64748b] text-sm leading-relaxed max-w-lg mb-10">
            Choose a plan that fits your goals and scale as you grow
          </p>

          {/* Toggle */}
          <div className="flex items-center gap-2 p-1 bg-white border border-[#e2e8f0] rounded-full">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-8 py-2.5 text-[14px] font-semibold transition-all rounded-full",
                billingCycle === "monthly"
                  ? "bg-[#0a192f] text-white shadow-lg"
                  : "text-[#64748b] hover:text-[#0a192f]"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-8 py-2.5 text-[14px] font-semibold transition-all rounded-full flex items-center gap-2",
                billingCycle === "yearly"
                  ? "bg-[#0a192f] text-white shadow-lg"
                  : "text-[#64748b] hover:text-[#0a192f]"
              )}
            >
              Yearly
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
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
                "relative flex flex-col p-8 rounded-2xl border transition-all duration-300 group",
                plan.popular 
                  ? "bg-white border-[#0a192f] shadow-xl shadow-[#0a192f]/10" 
                  : "bg-white border-[#e2e8f0] hover:border-[#0a192f]/30 shadow-lg hover:shadow-[#0a192f]/5"
              )}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0a192f] text-white text-[12px] font-bold shadow-lg">
                    <span className="uppercase tracking-wider">Most Popular</span>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-bold text-[#0a192f] mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-[#0a192f] tracking-tight">
                    {plan.price !== "Custom" ? `$${plan.price}` : plan.price}
                  </span>
                  {plan.description && (
                    <span className="text-base text-[#64748b] font-medium">{plan.description}</span>
                  )}
                </div>
              </div>

              <button
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-semibold transition-all mb-10",
                  plan.popular
                    ? "bg-[#0a192f] text-white hover:bg-[#112240] shadow-lg"
                    : "bg-white border-[#e2e8f0] text-[#0a192f] hover:bg-[#fafbfc] hover:border-[#0a192f]"
                )}
              >
                {plan.cta} <ArrowUpRight size={18} />
              </button>

              <div className="flex flex-col gap-4">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                      plan.popular ? "bg-[#0a192f]/10 text-[#0a192f]" : "bg-[#f1f5f9] text-[#94a3b8]"
                    )}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-[#475569] font-medium leading-tight">
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
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-[#e2e8f0]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0a192f"
              strokeWidth="2.5"
              className="opacity-70"
            >
              <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
            </svg>
            <p className="text-sm text-[#64748b] font-medium">
              We donate 2% of your membership to pediatric wellbeing
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
