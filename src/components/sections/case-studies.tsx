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
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 md:p-12 transition-all duration-500 hover:border-[#101728]/10 hover:shadow-2xl hover:shadow-gray-200/50">
        {/* Background gradient */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#101728]/[0.02] blur-[80px] group-hover:bg-[#101728]/[0.05] transition-all duration-700" />

        {/* Top row: number + category */}
        <div className="relative flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className="text-5xl md:text-6xl font-bold text-[#101728]/[0.04] tracking-tighter">
              {study.number}
            </span>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-100 bg-gray-50/50">
              <span className="text-[11px] font-bold tracking-wider text-[#101728]/40 uppercase">
                {study.category}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center transition-all duration-300 group-hover:border-[#101728]/10 group-hover:bg-[#101728]/5">
            <ArrowUpRight className="w-4 h-4 text-[#101728]/40 group-hover:text-[#101728]" />
          </div>
        </div>

        {/* Title */}
        <h3 className="relative text-2xl md:text-3xl font-bold tracking-tight text-[#101728] mb-4">
          {study.title}
        </h3>

        {/* Description */}
        <p className="relative text-gray-500 text-[15px] leading-relaxed mb-10 max-w-xl font-medium">
          {study.description}
        </p>

        {/* Metrics */}
        <div className="relative flex items-center gap-10">
          {study.metrics.map((metric, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-[#101728]">{metric.value}</span>
              <span className="text-[10px] font-bold text-[#101728]/40 uppercase tracking-[0.2em]">{metric.label}</span>
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-gray-100 bg-gray-50/50">
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#101728]/40 uppercase">
                Success Stories
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-[#101728]">
              Case <span className="italic font-normal text-gray-400">Studies</span>
            </h2>
          </motion.div>

          <motion.p
            className="max-w-md text-gray-500 text-[15px] leading-relaxed font-medium"
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
