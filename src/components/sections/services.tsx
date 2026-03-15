"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Bot,
  Ticket,
  Workflow,
  BookOpen,
  BarChart3,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

interface ServiceItem {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  subServices: string[];
  toolIcons: string[];
}

const services: ServiceItem[] = [
  {
    number: "01",
    title: "Live Chat",
    icon: MessageSquare,
    description:
      "Real-time customer communication with a powerful inbox that keeps every conversation organized across channels — web, email, and social.",
    subServices: [
      "Real-Time Messaging",
      "Multi-Channel Inbox",
      "Visitor Tracking",
      "Pre-Chat Forms",
    ],
    toolIcons: ["💬", "📧", "🌐", "📱"],
  },
  {
    number: "02",
    title: "AI Chatbot",
    icon: Bot,
    description:
      "Intelligent AI agents that handle customer queries 24/7, learn from your knowledge base, and hand off to humans when needed.",
    subServices: [
      "Natural Language AI",
      "Knowledge Base RAG",
      "Smart Handoff",
      "Personality Tuning",
    ],
    toolIcons: ["🤖", "🧠", "⚡", "🔗"],
  },
  {
    number: "03",
    title: "Ticketing System",
    icon: Ticket,
    description:
      "A complete help desk built for speed. Manage, prioritize, and resolve customer issues with structured workflows and SLA tracking.",
    subServices: [
      "Priority Management",
      "SLA Tracking",
      "Team Assignment",
      "Status Workflows",
    ],
    toolIcons: ["🎫", "📋", "👥", "⏱️"],
  },
  {
    number: "04",
    title: "Automation & Flows",
    icon: Workflow,
    description:
      "Build visual automation flows that trigger based on customer behavior, route conversations, and execute actions without code.",
    subServices: [
      "Visual Flow Builder",
      "Event Triggers",
      "Conditional Logic",
      "Auto-Routing",
    ],
    toolIcons: ["⚙️", "🔄", "📊", "🚀"],
  },
  {
    number: "05",
    title: "Knowledge Base",
    icon: BookOpen,
    description:
      "Create and manage a centralized knowledge hub that powers your AI, self-service portals, and agent assist features.",
    subServices: [
      "Article Management",
      "AI-Powered Search",
      "Web Scraping Import",
      "Vector Embeddings",
    ],
    toolIcons: ["📚", "🔍", "📝", "💡"],
  },
  {
    number: "06",
    title: "Analytics & Insights",
    icon: BarChart3,
    description:
      "Deep insights into customer satisfaction, agent performance, AI accuracy, and conversation trends — all in real time.",
    subServices: [
      "Real-Time Dashboards",
      "AI Performance Metrics",
      "Agent Analytics",
      "Custom Reports",
    ],
    toolIcons: ["📈", "🎯", "📉", "🏆"],
  },
];

/* ── Expanded (active) card ── */
function ExpandedCard({ service }: { service: ServiceItem }) {
  const Icon = service.icon;
  return (
    <motion.div
      layoutId={`card-${service.number}`}
      className="relative flex flex-col justify-between w-[420px] min-w-[420px] h-[520px] rounded-2xl p-8 overflow-hidden shrink-0 cursor-pointer"
      style={{
        background:
          "linear-gradient(135deg, rgba(88,60,180,0.85) 0%, rgba(60,50,140,0.9) 40%, rgba(40,35,100,0.95) 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top: Title + Arrow */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-2xl font-semibold text-gray-900 tracking-tight leading-tight">
            {service.title}
          </h3>
          <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center shrink-0 ml-4 mt-0.5">
            <ArrowUpRight className="w-4 h-4 text-gray-900/70" />
          </div>
        </div>
      </div>

      {/* Middle: Description */}
      <motion.p
        className="text-gray-900/60 text-[14px] leading-relaxed my-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {service.description}
      </motion.p>

      {/* Bottom: Services + Tools */}
      <div className="mt-auto">
        <div className="flex gap-10">
          {/* Sub-services */}
          <div>
            <p className="text-gray-900/40 text-xs font-medium tracking-wider uppercase mb-3">
              Services
            </p>
            <ul className="space-y-1.5">
              {service.subServices.map((sub) => (
                <li
                  key={sub}
                  className="text-gray-900/70 text-[13px] font-medium"
                >
                  {sub}
                </li>
              ))}
            </ul>
          </div>

          {/* Tool icons */}
          <div>
            <p className="text-gray-900/40 text-xs font-medium tracking-wider uppercase mb-3">
              Tools
            </p>
            <div className="grid grid-cols-3 gap-2">
              {service.toolIcons.map((icon, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-lg bg-white/10 border border-gray-200 flex items-center justify-center text-base"
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Collapsed (inactive) card ── */
function CollapsedCard({
  service,
  onClick,
}: {
  service: ServiceItem;
  onClick: () => void;
}) {
  const Icon = service.icon;
  return (
    <motion.div
      layoutId={`card-${service.number}`}
      onClick={onClick}
      className="relative flex flex-col justify-between w-[200px] min-w-[200px] h-[520px] rounded-2xl p-6 overflow-hidden shrink-0 cursor-pointer transition-all duration-300 hover:bg-white/[0.04]"
      style={{
        background: "rgba(15,15,25,0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      whileHover={{ borderColor: "rgba(255,255,255,0.12)" }}
    >
      {/* Top: Number + Arrow */}
      <div className="flex items-start justify-between">
        <span className="text-3xl font-bold text-gray-900/15 tracking-tight">
          {service.number}
        </span>
        <div className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center">
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-900/25" />
        </div>
      </div>

      {/* Icon in middle */}
      <div className="flex items-center justify-center my-auto">
        <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-900/25" />
        </div>
      </div>

      {/* Bottom: Title */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900/50 tracking-tight leading-tight">
          {service.title}
        </h3>
      </div>
    </motion.div>
  );
}

const Services = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-[120px] bg-[#ffffff]" id="services">
      <div className="container px-6 mx-auto max-w-[1400px]">
        {/* Header - split layout like Antimatter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-gray-900">
              Our Services
            </h2>
          </motion.div>

          <motion.p
            className="text-gray-900/35 text-[15px] leading-relaxed self-end"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            We offer comprehensive digital solutions that transform your
            business and drive innovation across every touchpoint.
          </motion.p>
        </div>

        {/* Horizontal scrolling card carousel */}
        <motion.div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {services.map((service, i) =>
            activeIndex === i ? (
              <ExpandedCard key={service.number} service={service} />
            ) : (
              <CollapsedCard
                key={service.number}
                service={service}
                onClick={() => setActiveIndex(i)}
              />
            )
          )}
        </motion.div>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default Services;
