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
  },
];

function CaseCard({ study, index }: { study: typeof caseStudies[0]; index: number }) {
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-8 transition-all duration-500 hover:border-[#0a192f]/20 hover:shadow-xl hover:shadow-[#0a192f]/5">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#0a192f]/5 rounded-full blur-2xl -z-10" />

        {/* Top row: number + category */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-[#0a192f]/10 tracking-tighter">
              {study.number}
            </span>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#e2e8f0] bg-[#fafbfc]">
              <span className="text-[10px] font-semibold tracking-wider text-[#64748b] uppercase">
                {study.category}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg border border-[#e2e8f0] flex items-center justify-center transition-all duration-300 group-hover:border-[#0a192f]/30 group-hover:bg-[#0a192f]/5">
            <ArrowUpRight className="w-4 h-4 text-[#94a3b8] group-hover:text-[#0a192f]" />
          </div>
        </div>

        {/* Title */}
        <h3 className="relative text-xl md:text-2xl font-bold tracking-tight text-[#0a192f] mb-3">
          {study.title}
        </h3>

        {/* Description */}
        <p className="relative text-[#64748b] text-sm leading-relaxed mb-8">
          {study.description}
        </p>

        {/* Metrics */}
        <div className="relative flex items-center gap-8">
          {study.metrics.map((metric, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-xl font-bold text-[#0a192f]">{metric.value}</span>
              <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function CaseStudies() {
  return (
    <section className="py-24 bg-white" id="case-studies">
      <div className="container px-6 mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[#e2e8f0] bg-[#fafbfc]">
              <span className="text-[11px] font-semibold tracking-wide text-[#64748b] uppercase">
                Success Stories
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0a192f]">
              Case <span className="italic font-normal text-[#94a3b8]">Studies</span>
            </h2>
          </motion.div>

          <motion.p
            className="max-w-md text-[#64748b] text-sm leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
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
