"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Bot, Phone, Calendar, MessageSquare, Stethoscope, 
  ShoppingCart, CreditCard, Clock, Check, ArrowRight,
  Star, Quote, Sparkles
} from "lucide-react";
import Link from "next/link";

const templateCategories = [
  {
    id: "appointment-booking",
    icon: Calendar,
    name: "Appointment Booking",
    description: "Automate scheduling for clinics, salons, consultations. Handles availability, sends reminders, syncs with Google Calendar.",
    color: "#0a192f",
    metrics: "87% booking rate",
    quote: {
      text: "I went from 10 calls a day to 50 bookings without picking up the phone once.",
      author: "Dr. Priya Sharma",
      role: "Wellness Center Owner"
    }
  },
  {
    id: "faq-responder",
    icon: MessageSquare,
    name: "FAQ Responder",
    description: "Instantly answers common questions about hours, services, pricing, policies. Reduces support tickets by 60%.",
    color: "#059669",
    metrics: "92% satisfaction",
    quote: {
      text: "My customers get answers at 3 AM. I stopped getting 'What are your hours?' texts completely.",
      author: "Rahul Mehta",
      role: "E-commerce Store Owner"
    }
  },
  {
    id: "qualify-leads",
    icon: CreditCard,
    name: "Lead Qualification",
    description: "Asks qualifying questions, collects contact info, scores leads, and routes hot prospects to your sales team.",
    color: "#7c3aed",
    metrics: "3x more qualified leads",
    quote: {
      text: "We now know exactly which leads to call. Our sales team's close rate doubled.",
      author: "Ananya Patel",
      role: "Real Estate Agency Director"
    }
  },
  {
    id: "order-status",
    icon: ShoppingCart,
    name: "Order Status Tracker",
    description: "Customers ask 'Where's my order?' and get real-time updates from your e-commerce platform. Integrates with Shopify, WooCommerce.",
    color: "#ea580c",
    metrics: "70% fewer support tickets",
    quote: {
      text: "Our support team stopped hating Mondays. Order tracking calls dropped overnight.",
      author: "Vikram Singh",
      role: "Fashion Retailer"
    }
  },
  {
    id: "payment-reminder",
    icon: Phone,
    name: "Payment Reminder Agent",
    description: "Automates outbound calls to remind customers about overdue invoices. Politeness with persistence gets 65% payment rate.",
    color: "#dc2626",
    metrics: "65% payment collection",
    quote: {
      text: "Cash flow improved dramatically. The AI is more diplomatic than my collection manager!",
      author: "Kavya Reddy",
      role: "Medical Billing Service"
    }
  },
  {
    id: "health-intake",
    icon: Stethoscope,
    name: "Health Intake Form",
    description: "For healthcare: Collects symptoms, medical history, insurance info before appointments. HIPAA compliant, EHR integration.",
    color: "#0891b2",
    metrics: "80% time saved per patient",
    quote: {
      text: "Patients fill forms at home. Doctors get complete histories before the appointment. Game changer.",
      author: "Dr. Arjun Nair",
      role: "Clinic Director"
    }
  },
];

const stats = [
  { value: "50+", label: "Templates" },
  { value: "2-min", label: "Setup Time" },
  { value: "99.9%", label: "Uptime" },
];

export default function TemplatesShowcase() {
  return (
    <section className="py-24 bg-[#ffffff] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0a192f] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3b82f6] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 max-w-[1400px] relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[#e2e8f0] bg-[#f8fafc]">
            <Sparkles size={12} className="text-[#0a192f]" />
            <span className="text-[11px] font-bold tracking-wide text-[#64748b] uppercase">
              Template Library
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#0a192f] mb-6">
            Start in minutes, <br />
            <span className="text-[#3b82f6]">not months</span>
          </h2>
          <p className="text-xl text-[#64748b] leading-relaxed max-w-3xl mx-auto font-light">
            Choose from 50+ expertly designed conversation templates. Each one is pre-built, tested, and ready to deploy with one click.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex justify-center gap-16 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0a192f] mb-2">{stat.value}</div>
              <div className="text-sm text-[#64748b] font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {templateCategories.map((template, index) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                className="group relative flex flex-col p-8 rounded-2xl border border-[#e2e8f0] bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Top accent line */}
                <motion.div
                  className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
                  style={{ backgroundColor: template.color }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />

                {/* Icon */}
                <div 
                  className="mb-6 w-14 h-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: template.color + "15" }}
                >
                  <Icon className="w-7 h-7" style={{ color: template.color }} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#0a192f] mb-3 group-hover:text-[#3b82f6] transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-[#64748b] leading-relaxed mb-5">
                    {template.description}
                  </p>

                  {/* Metrics badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f8fafc] border border-[#e2e8f0] text-xs font-semibold text-[#475569] mb-6">
                    <Check size={12} style={{ color: template.color }} />
                    {template.metrics}
                  </div>

                  {/* Quote */}
                  <div className="relative pl-4 border-l-2 border-[#e2e8f0]">
                    <Quote size={16} className="absolute -left-[9px] top-0 text-[#e2e8f0]" />
                    <p className="text-xs text-[#475569] italic leading-relaxed mb-3">
                      &ldquo;{template.quote.text}&rdquo;
                    </p>
                    <div>
                      <p className="text-xs font-semibold text-[#0a192f]">{template.quote.author}</p>
                      <p className="text-[10px] text-[#94a3b8]">{template.quote.role}</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/panel/templates?category=${template.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0a192f] hover:text-[#3b82f6] transition-colors"
                >
                  <span>Use this template</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-[#e2e8f0] mb-24" />

        {/* Industry Workspaces Showcase */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0a192f] mb-4">
              Industry Workspaces
            </h3>
            <p className="text-lg text-[#64748b] max-w-2xl mx-auto font-light">
              Go beyond templates. Get a complete, pre-configured workspace tailored to your industry's unique needs.
            </p>
          </div>

          {/* Workspace cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                industry: "Healthcare",
                icon: "🏥",
                templates: "12 templates",
                integrations: "EHR, SMS, Email",
                color: "#0891b2"
              },
              {
                industry: "Real Estate",
                icon: "🏠",
                templates: "10 templates",
                integrations: "CRM, Calendar",
                color: "#7c3aed"
              },
              {
                industry: "Restaurants",
                icon: "🍽️",
                templates: "8 templates",
                integrations: "Reservation systems",
                color: "#ea580c"
              },
              {
                industry: "Salons & Spas",
                icon: "💇",
                templates: "9 templates",
                integrations: "Booking, POS",
                color: "#db2777"
              },
              {
                industry: "Legal",
                icon: "⚖️",
                templates: "11 templates",
                integrations: "Document management",
                color: "#0a192f"
              },
              {
                industry: "Education",
                icon: "🎓",
                templates: "7 templates",
                integrations: "LMS, SIS",
                color: "#059669"
              },
            ].map((workspace, idx) => (
              <motion.div
                key={workspace.industry}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="relative p-8 rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-white to-[#f8fafc] overflow-hidden group hover:shadow-lg transition-all"
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${workspace.color}, ${workspace.color}40)` }}
                />
                <div className="text-4xl mb-4">{workspace.icon}</div>
                <h4 className="text-xl font-bold text-[#0a192f] mb-3">{workspace.industry}</h4>
                <div className="space-y-2 text-sm text-[#64748b] mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: workspace.color }} />
                    <span>{workspace.templates} included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: workspace.color }} />
                    <span>{workspace.integrations}</span>
                  </div>
                </div>
                <Link
                  href="/panel/industries"
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: workspace.color }}
                >
                  Open workspace
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Powerful Quote */}
        <motion.div
          className="mt-32 relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="absolute -top-6 left-12 text-[120px] leading-none text-[#0a192f] opacity-5 font-serif">
            &ldquo;
          </div>
          <div className="relative max-w-4xl mx-auto text-center px-12 py-16 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
            <Quote size={32} className="mx-auto mb-8 text-[#0a192f]/20" />
            <p className="text-2xl md:text-3xl font-bold text-[#0a192f] leading-relaxed mb-10">
              We went from zero customer service to handling 5,000 conversations a month. 
              <span className="text-[#3b82f6]"> All without hiring a single agent.</span>
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#0a192f] to-[#3b82f6] flex items-center justify-center text-xl font-bold text-white">
                MS
              </div>
              <div className="text-left">
                <p className="font-bold text-[#0a192f]">Mukesh Sharma</p>
                <p className="text-sm text-[#64748b]">CEO, TechStart Solutions</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-lg text-[#64748b] mb-8 font-light">
            Ready to transform your customer service?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#0a192f] text-white font-semibold text-base hover:bg-[#112240] transition-all shadow-lg shadow-[#0a192f]/20"
            >
              Start free trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-[#e2e8f0] text-[#0a192f] font-semibold text-base hover:border-[#0a192f] hover:bg-[#0a192f]/5 transition-all"
            >
              Schedule demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
