"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  MessageSquare, 
  Bot, 
  Phone, 
  ArrowRight,
  Shield,
  Globe,
  Zap
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative w-full bg-white pt-32 pb-20 overflow-hidden">
      {/* Background decorative elements - minimal */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        {/* Removed blur circles for complete minimalist design */}
      </div>


      <div className="container mx-auto px-6 max-w-[1200px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          
          {/* Left Content: Clean Typography */}
          <div className="flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a192f]/5 border border-[#0a192f]/10 mb-8"
            >
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Bot className="w-3.5 h-3.5 text-[#0a192f]" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
                >
                  <Phone className="w-3.5 h-3.5 text-[#3b82f6]" />
                </motion.div>
              </div>
              <span className="text-[11px] font-bold tracking-wider text-[#0a192f] uppercase">
                AI Chat & Voice Agents
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-5xl md:text-6xl lg:text-[72px] font-bold text-[#0a192f] leading-[1.1] tracking-tight mb-8"
            >
              Intelligent Customer <br />
              <span className="text-[#3b82f6]">Engagement</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-lg md:text-xl text-[#64748b] max-w-xl mb-12 leading-relaxed font-light"
            >
              Deploy AI-powered chatbots and voice agents that handle customer conversations with human-like precision. Start with 50+ pre-built templates or industry-specific workspaces. Scale support without scaling costs.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link 
                href="/sign-up" 
                className="group h-14 px-10 rounded-full bg-[#0a192f] text-white font-semibold text-base flex items-center gap-3 transition-all hover:shadow-2xl hover:shadow-[#0a192f]/20 hover:-translate-y-0.5"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link 
                href="#demo" 
                className="h-14 px-10 rounded-full border-2 border-[#e2e8f0] bg-white text-[#0a192f] font-semibold text-base flex items-center transition-all hover:border-[#0a192f] hover:bg-[#0a192f]/5"
              >
                Book a Demo
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-16 flex items-center gap-8"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-[#0a192f] to-[#3b82f6]" />
                ))}
              </div>
              <div className="h-4 w-[1px] bg-[#e2e8f0]" />
              <div className="text-sm text-[#64748b] font-medium">
                Trusted by 5,000+ businesses worldwide
              </div>
            </motion.div>
          </div>

          {/* Right Content: Clean Product Visual */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
          >
            {/* Main Dashboard Mockup */}
            <div className="relative z-10 rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-2xl shadow-[#0a192f]/5">
              <div className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-[#fafbfc] relative aspect-[4/3] flex flex-col">
                {/* Toolbar */}
                <div className="h-12 border-b border-[#e2e8f0] flex items-center px-5 gap-2.5 bg-white">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ef4444]" />
                    <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                    <div className="h-3 w-3 rounded-full bg-[#10b981]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-6 w-48 rounded bg-[#f1f5f9]" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 p-6 flex gap-5">
                  {/* Sidebar */}
                  <div className="w-16 flex flex-col gap-3">
                    <div className="h-8 rounded-lg bg-[#0a192f]" />
                    <div className="h-8 rounded-lg bg-[#f1f5f9]" />
                    <div className="h-8 rounded-lg bg-[#f1f5f9]" />
                    <div className="h-8 rounded-lg bg-[#f1f5f9]" />
                  </div>
                  {/* Main area */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="h-16 rounded-xl bg-white border border-[#e2e8f0]" />
                    <div className="grid grid-cols-2 gap-4 h-32">
                      <div className="rounded-xl bg-gradient-to-br from-[#0a192f]/5 to-[#0a192f]/10 border border-[#e2e8f0] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="w-5 h-5 text-[#0a192f]" />
                          <span className="text-xs font-semibold text-[#0a192f]">Chatbot</span>
                        </div>
                        <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "75%" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-[#0a192f]"
                          />
                        </div>
                        <p className="text-[10px] text-[#64748b] mt-2">75% automated</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-[#3b82f6]/5 to-[#3b82f6]/10 border border-[#e2e8f0] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Phone className="w-5 h-5 text-[#3b82f6]" />
                          <span className="text-xs font-semibold text-[#3b82f6]">Voice Agent</span>
                        </div>
                        <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "92%" }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                            className="h-full bg-[#3b82f6]"
                          />
                        </div>
                        <p className="text-[10px] text-[#64748b] mt-2">92% answered</p>
                      </div>
                    </div>
                    <div className="flex-1 rounded-xl bg-white border border-[#e2e8f0] p-4">
                      <div className="space-y-3">
                        <div className="h-2 w-3/4 bg-[#f1f5f9] rounded" />
                        <div className="h-2 w-1/2 bg-[#f1f5f9] rounded" />
                        <div className="h-2 w-2/3 bg-[#f1f5f9] rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-6 z-20 w-52 rounded-2xl bg-white p-5 shadow-xl border border-[#e2e8f0]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-[#0a192f]/5 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#0a192f]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0a192f]">AI Chatbot</div>
                  <div className="text-xs text-[#64748b]">Active 24/7</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-1.5 flex-1 rounded-full bg-[#e2e8f0] overflow-hidden">
                  <motion.div
                    animate={{ width: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="h-full bg-[#10b981]"
                  />
                </div>
                <span className="text-[#10b981] font-medium">Live</span>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-6 z-20 w-56 rounded-2xl bg-[#0a192f] p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#3b82f6]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Voice Agent</div>
                  <div className="text-xs text-[#94a3b8]">Handling calls</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-[#3b82f6] rounded-full"
                      style={{ height: 6 }}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/60 ml-2">Processing...</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Feature Footnotes - Minimal */}
      <div className="container mx-auto px-6 max-w-[1200px] mt-24 border-t border-[#e2e8f0] pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="h-10 w-10 rounded-xl bg-[#0a192f]/5 flex items-center justify-center flex-shrink-0"
            >
              <Bot className="w-5 h-5 text-[#0a192f]" />
            </motion.div>
            <div>
              <p className="text-sm font-bold text-[#0a192f] uppercase tracking-wider mb-2">AI Chatbots</p>
              <p className="text-sm text-[#64748b] leading-relaxed">Intelligent automation that understands context and delivers accurate responses instantly.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-l border-[#e2e8f0] pl-10">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="h-10 w-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center flex-shrink-0"
            >
              <Phone className="w-5 h-5 text-[#3b82f6]" />
            </motion.div>
            <div>
              <p className="text-sm font-bold text-[#0a192f] uppercase tracking-wider mb-2">Voice Agents</p>
              <p className="text-sm text-[#64748b] leading-relaxed">Natural-sounding AI voices that handle inbound and outbound calls with ease.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-l border-[#e2e8f0] pl-10">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="h-10 w-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center flex-shrink-0"
            >
              <Zap className="w-5 h-5 text-[#10b981]" />
            </motion.div>
            <div>
              <p className="text-sm font-bold text-[#0a192f] uppercase tracking-wider mb-2">Instant Setup</p>
              <p className="text-sm text-[#64748b] leading-relaxed">Deploy in minutes, not months. Integrate with your existing tools seamlessly.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
