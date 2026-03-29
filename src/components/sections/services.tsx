"use client";

import React from "react";
import { motion } from "framer-motion";
import { Layout, Factory, ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: Layout,
    iconBg: "bg-[#0a192f]",
    title: "Templates",
    subtitle: "Pre-built conversation flows",
    description: "Start instantly with 50+ expertly crafted templates for common use cases. Each template is fully customizable and ready to deploy in minutes.",
    highlights: [
      "50+ ready-to-use templates",
      "One-click deployment",
      "Fully customizable",
      "A/B testing built-in"
    ],
    color: "#0a192f",
    link: "/panel/templates",
    linkText: "Browse templates"
  },
  {
    icon: Factory,
    iconBg: "bg-[#0a192f]",
    title: "Industry Workspaces",
    subtitle: "Pre-configured for your vertical",
    description: "Jumpstart your setup with industry-specific workspaces. Each comes with curated templates, integration presets, and best-practice workflows tailored to your field.",
    highlights: [
      "10+ industry configurations",
      "Pre-loaded templates",
      "Integration presets",
      "Compliance ready"
    ],
    color: "#0a192f",
    link: "/panel/industries",
    linkText: "Explore workspaces"
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-[#ffffff]">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[#e2e8f0] bg-[#fafbfc]">
            <Sparkles size={12} className="text-[#0a192f]" />
            <span className="text-[11px] font-semibold tracking-wide text-[#64748b] uppercase">
              How it works
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0a192f] mb-4">
            Two ways to <span className="text-[#3b82f6]">get started</span>
          </h2>
          <p className="text-[#64748b] text-base leading-relaxed max-w-2xl mx-auto">
            Choose a template to build from scratch, or grab an industry workspace with everything pre-configured. Either way, you're minutes away from launch.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="group relative flex flex-col"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Card */}
              <div className="relative flex flex-col p-10 rounded-2xl border border-[#e2e8f0] bg-white h-full transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                {/* Top accent line */}
                <motion.div
                  className="absolute top-0 left-10 right-10 h-0.5 rounded-full"
                  style={{ backgroundColor: service.color }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />

                {/* Icon */}
                <div className={`mb-6 w-16 h-16 rounded-2xl ${service.iconBg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                {/* Text content */}
                <div className="flex-1">
                  <div className="mb-2">
                    <h3 className="text-2xl font-bold text-[#0a192f] mb-1">{service.title}</h3>
                    <p className="text-sm text-[#64748b] font-medium">{service.subtitle}</p>
                  </div>
                  <p className="text-[#475569] leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-3 mb-8">
                    {service.highlights.map((item) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-3 text-sm text-[#475569]"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${service.iconBg} bg-opacity-10`}>
                          <Check size={12} style={{ color: service.color }} />
                        </div>
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Link
                  href={service.link}
                  className="group/btn inline-flex items-center gap-2 text-sm font-semibold text-[#0a192f] hover:text-[#3b82f6] transition-colors"
                >
                  <span>{service.linkText}</span>
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </Link>
              </div>

              {/* Connecting arrow for first card */}
              {index === 0 && (
                <motion.div
                  className="hidden lg:flex absolute right-[-40px] top-1/2 -translate-y-1/2 z-10"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <ArrowRight size={24} className="text-[#cbd5e1]" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-[#64748b] text-sm mb-4">
            Not sure where to start? Our team can help you pick the right solution.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-[#0a192f] text-[#0a192f] font-semibold text-sm hover:bg-[#0a192f] hover:text-white transition-all duration-200"
          >
            Talk to an expert
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
