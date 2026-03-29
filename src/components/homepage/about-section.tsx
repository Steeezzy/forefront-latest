"use client";

import { motion } from "framer-motion";
import { Bot, Phone, Globe, Zap, Shield, Clock, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Bot,
    title: "AI Chatbots",
    description: "Intelligent agents that understand context, learn from interactions, and provide instant, accurate responses 24/7 in 11 Indian languages."
  },
  {
    icon: Phone,
    title: "Voice Agents",
    description: "Human-like AI voices that handle inbound/outbound calls, schedule appointments, qualify leads, and speak naturally."
  },
  {
    icon: Globe,
    title: "Multilingual",
    description: "Support for Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and more."
  },
  {
    icon: Zap,
    title: "2-Minute Setup",
    description: "No coding required. Choose a template, customize, and go live in minutes. A/B test and optimize continuously."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant, end-to-end encryption, GDPR-ready, and data residency in India for complete peace of mind."
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Never miss a customer query. Your AI agents work round the clock, across time zones, with zero downtime."
  },
];

export default function AboutSection() {
  return (
    <section className="py-20 bg-[#ffffff] border-b border-[#e2e8f0]">
      <div className="container mx-auto px-6 max-w-[1200px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0a192f] mb-4">
            What is <span className="text-[#3b82f6]">Questron</span>?
          </h2>
          <p className="text-lg text-[#64748b] max-w-3xl mx-auto leading-relaxed font-light">
            Questron is India's first AI Customer Service Platform that combines intelligent chatbots with human-like voice agents. We help businesses of all sizes automate customer conversations, scale support, and grow revenue—without hiring extra staff.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                className="group p-6 rounded-2xl border border-[#e2e8f0] bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0a192f] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#0a192f] mb-3">{feature.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-[#64748b] text-sm mb-6 font-light">
            Ready to transform your customer service?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#0a192f] text-white font-semibold hover:bg-[#112240] transition-all shadow-lg shadow-[#0a192f]/20"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl border-2 border-[#e2e8f0] text-[#0a192f] font-semibold hover:border-[#0a192f] hover:bg-[#0a192f]/5 transition-all"
            >
              Schedule Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
