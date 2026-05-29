'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  ShoppingBag, Code2, HeartPulse, Building2,
  Bot, Phone, Zap, BarChart3, ArrowRight,
  Globe, Layers, Shield, Sparkles,
} from 'lucide-react';

// ─── Division data ──────────────────────────────────────────────────────────
const divisions = [
  {
    id: 'commerce',
    label: 'Qestron Commerce',
    tagline: 'AI-Powered Retail & E-commerce',
    description: 'Deploy smart chatbots and voice agents for online stores. Automate product discovery, order support, and abandoned cart recovery.',
    icon: ShoppingBag,
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-200/60 hover:border-blue-400/60',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
    href: '/hub/ecommerce/panel',
    features: ['Smart Product Recommendations', 'Order Status Voice Agents', 'Cart Recovery Campaigns'],
  },
  {
    id: 'dev',
    label: 'Qestron Dev',
    tagline: 'Developer Tools & API Platform',
    description: 'Build and integrate AI agents into your products. Full API access, webhooks, custom workflows, and headless deployment.',
    icon: Code2,
    color: 'from-violet-500/10 to-violet-600/5',
    border: 'border-violet-200/60 hover:border-violet-400/60',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
    badge: 'bg-violet-50 text-violet-700 border-violet-200/60',
    href: '/hub/developer/panel',
    features: ['REST & GraphQL APIs', 'Custom Webhook Integrations', 'White-label Deployment'],
  },
  {
    id: 'health',
    label: 'Qestron Health',
    tagline: 'Healthcare AI Compliance Suite',
    description: 'HIPAA-ready AI agents for clinics and hospitals. Appointment scheduling, patient intake, prescription reminders, and multilingual support.',
    icon: HeartPulse,
    color: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-200/60 hover:border-emerald-400/60',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    href: '/hub/care/panel',
    features: ['HIPAA-Compliant Agents', 'Appointment Scheduling', 'Multilingual Patient Support'],
  },
  {
    id: 'sme',
    label: 'Qestron SME',
    tagline: 'Small Business Growth Engine',
    description: 'Everything a growing business needs — local SEO agents, WhatsApp bots, review management, and voice-first customer support.',
    icon: Building2,
    color: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-200/60 hover:border-amber-400/60',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    href: '/hub/sme/panel',
    features: ['WhatsApp & Instagram Bots', 'Review Management AI', 'Voice Support Agents'],
  },
];

// ─── Stats ───────────────────────────────────────────────────────────────────
const stats = [
  { value: '50+', label: 'Pre-built Templates' },
  { value: '17', label: 'AI Agent Types' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '4', label: 'Industry Divisions' },
];

// ─── Quick capabilities ───────────────────────────────────────────────────────
const capabilities = [
  { icon: Bot,      label: 'Chatbot Agents',    desc: 'GPT-4 powered chat across web, app & WhatsApp' },
  { icon: Phone,    label: 'Voice AI',           desc: 'Real-time voice agents with natural speech' },
  { icon: Zap,      label: 'Automation',         desc: 'Visual flow builder for complex workflows' },
  { icon: BarChart3,label: 'Analytics',          desc: 'Unified dashboard for all agent performance' },
  { icon: Globe,    label: 'Multichannel',       desc: 'Deploy across 12+ channels simultaneously' },
  { icon: Shield,   label: 'Enterprise Security',desc: 'SOC 2, HIPAA, and GDPR ready infrastructure' },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:  { opacity: 1, y: 0 },
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function HubPage() {
  const { user } = useUser();
  const firstName = user?.firstName || 'there';

  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 bg-white/90 backdrop-blur-xl border-b border-gray-200/60">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#0a192f] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-sm tracking-tighter">Q</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#0a192f]">Questron</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/panel/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#64748b] hover:text-[#0a192f] transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Panel
          </Link>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
        </div>
      </header>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="pt-14">
        <div className="bg-gradient-to-br from-[#0a192f] via-[#0f2847] to-[#0a192f] px-6 py-16 lg:py-20 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/6 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Qestron Platform Hub</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
                Welcome back, <span className="text-blue-400">{firstName}</span>
              </h1>
              <p className="text-gray-400 text-base md:text-lg max-w-xl leading-relaxed mb-8">
                Your AI agency platform across four industry verticals. Choose a division to get started or enter the unified panel.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Division Cards */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold text-[#0a192f]">Select Your Division</h2>
            <p className="text-sm text-[#64748b] mt-1">Each division is tailored for a specific industry vertical</p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {divisions.map((div) => {
              const Icon = div.icon;
              return (
                <motion.div key={div.id} variants={item}>
                  <Link href={div.href} className="group block">
                    <div className={`relative h-full bg-white rounded-2xl border ${div.border} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
                      {/* Gradient bg */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${div.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                      <div className="relative z-10">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl ${div.iconBg} flex items-center justify-center mb-4`}>
                          <Icon className={`w-5 h-5 ${div.iconColor}`} />
                        </div>

                        {/* Label + badge */}
                        <div className="mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${div.badge}`}>
                            {div.id}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-[#0a192f] mt-2 mb-1 leading-tight">
                          {div.label}
                        </h3>
                        <p className="text-xs text-[#64748b] font-medium mb-3">{div.tagline}</p>
                        <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">{div.description}</p>

                        {/* Features list */}
                        <ul className="space-y-1.5 mb-4">
                          {div.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-xs text-[#64748b]">
                              <div className={`w-1 h-1 rounded-full ${div.iconBg.replace('/10', '')} flex-shrink-0`} />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <div className={`flex items-center gap-1 text-xs font-semibold ${div.iconColor} group-hover:gap-2 transition-all`}>
                          Enter Division
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Platform Capabilities */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold text-[#0a192f]">Platform Capabilities</h2>
            <p className="text-sm text-[#64748b] mt-1">Every division includes the full Qestron capability suite</p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <motion.div key={cap.label} variants={item}>
                  <div className="bg-white rounded-xl border border-gray-200/60 p-4 hover:border-gray-300/60 hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-lg bg-[#0a192f]/5 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-[#0a192f]" />
                    </div>
                    <p className="text-sm font-semibold text-[#0a192f] mb-0.5">{cap.label}</p>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">{cap.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Quick entry CTA */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-gradient-to-r from-[#0a192f] to-[#1e3a5f] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Jump into the unified panel</h3>
              <p className="text-gray-400 text-sm">All 17 agent types, analytics, automations, and integrations in one place.</p>
            </div>
            <Link
              href="/panel/dashboard"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0a192f] rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors shadow-xl"
            >
              Open Panel
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
