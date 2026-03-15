"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const caseStudies = [
  {
    number: "01",
    title: "E-Commerce Support Overhaul",
    category: "AI Chatbot + Live Chat",
    description:
      "Deployed an AI-powered support system that handles 80% of pre-sale and post-sale inquiries automatically, reducing ticket volume by 60%.",
    metrics: [
      { value: "80%", label: "Auto-Resolution" },
      { value: "3x", label: "Faster Response" },
    ],
    gradient: "from-blue-500/20 to-purple-500/20",
  },
  {
    number: "02",
    title: "SaaS Onboarding Automation",
    category: "Flows + Knowledge Base",
    description:
      "Built an intelligent onboarding flow that guides new users through product setup with contextual help, reducing churn by 35%.",
    metrics: [
      { value: "35%", label: "Less Churn" },
      { value: "2.5x", label: "Activation Rate" },
    ],
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    number: "03",
    title: "Healthcare Patient Portal",
    category: "Ticketing + AI Agent",
    description:
      "Created a HIPAA-compliant support portal with intelligent ticket routing, priority escalation, and AI-assisted responses for 50K+ patients.",
    metrics: [
      { value: "50K+", label: "Patients Served" },
      { value: "98%", label: "Satisfaction" },
    ],
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    number: "04",
    title: "FinTech Multi-Channel Hub",
    category: "Integrations + Analytics",
    description:
      "Unified customer conversations from email, WhatsApp, and web chat into a single inbox with real-time analytics and compliance tracking.",
    metrics: [
      { value: "5", label: "Channels Unified" },
      { value: "4.9★", label: "CSAT Score" },
    ],
    gradient: "from-emerald-500/20 to-cyan-500/20",
  },
];

function CaseCard({ study, index }: { study: typeof caseStudies[0]; index: number }) {
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-10 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.03]">
        {/* Background gradient */}
        <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-gradient-to-br ${study.gradient} blur-[100px] opacity-0 group-hover:opacity-40 transition-opacity duration-700`} />

        {/* Top row: number + category */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl md:text-6xl font-bold text-gray-900/[0.04] tracking-tighter">
              {study.number}
            </span>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="text-[11px] font-medium tracking-wider text-gray-900/40 uppercase">
                {study.category}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-white/20">
            <ArrowUpRight className="w-4 h-4 text-gray-900/50" />
          </div>
        </div>

        {/* Title */}
        <h3 className="relative text-2xl md:text-3xl font-semibold tracking-tight text-gray-900/80 group-hover:text-gray-900 transition-colors duration-300 mb-4">
          {study.title}
        </h3>

        {/* Description */}
        <p className="relative text-gray-900/30 text-[15px] leading-relaxed mb-8 max-w-xl">
          {study.description}
        </p>

        {/* Metrics */}
        <div className="relative flex items-center gap-8">
          {study.metrics.map((metric, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900/70">{metric.value}</span>
              <span className="text-xs text-gray-900/30 uppercase tracking-wider">{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function CaseStudies() {
  return (
    <section className="py-[120px] bg-[#ffffff]" id="case-studies">
      <div className="container px-6 mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="text-[11px] font-medium tracking-[0.2em] text-gray-900/50 uppercase">
                Our Work
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-gray-900">
              Case{" "}
              <span
                className="italic font-normal"
                style={{
                  backgroundImage: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Studies
              </span>
            </h2>
          </motion.div>

          <motion.p
            className="max-w-md text-gray-900/35 text-[15px] leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            How businesses around the world use Questron to transform their
            customer experience and scale support operations.
          </motion.p>
        </div>

        {/* Case Study Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {caseStudies.map((study, i) => (
            <CaseCard key={study.number} study={study} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
