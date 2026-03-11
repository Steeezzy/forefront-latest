"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Forefront completely transformed how we handle customer support. Our response times dropped from hours to seconds, and customers love the AI chatbot.",
    name: "Sarah Chen",
    role: "VP of Customer Success",
    company: "TechFlow",
    rating: 5,
  },
  {
    quote:
      "The automation flows saved us 40+ hours per week. We set up intelligent routing and the AI handles tier-1 queries without any human intervention.",
    name: "Marcus Rivera",
    role: "Head of Operations",
    company: "ScaleUp Labs",
    rating: 5,
  },
  {
    quote:
      "We evaluated every major support platform. Forefront's AI accuracy and knowledge base integration is simply unmatched. It feels like having 10 extra agents.",
    name: "Priya Patel",
    role: "CTO",
    company: "MedConnect",
    rating: 5,
  },
  {
    quote:
      "The analytics dashboard gives us real-time visibility into customer sentiment and agent performance. It's become essential for our daily standups.",
    name: "James Okonkwo",
    role: "Director of Support",
    company: "FinGuard",
    rating: 5,
  },
  {
    quote:
      "Setting up multi-channel support used to be a nightmare. Forefront unified everything — email, chat, social — into one clean inbox in under a day.",
    name: "Lena Bergström",
    role: "Customer Experience Lead",
    company: "NordShop",
    rating: 5,
  },
  {
    quote:
      "Our CSAT score went from 3.2 to 4.8 within three months of deploying Forefront. The AI learns fast and our customers notice the difference.",
    name: "David Kim",
    role: "Founder & CEO",
    company: "Helix AI",
    rating: 5,
  },
];

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
  return (
    <motion.div
      className="group relative flex flex-col justify-between p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.03]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Stars */}
      <div className="flex items-center gap-1 mb-6">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 text-yellow-500/80 fill-yellow-500/80"
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-white/50 text-[15px] leading-relaxed mb-8 flex-1">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-4">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center">
          <span className="text-sm font-semibold text-white/60">
            {testimonial.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-white/70">
            {testimonial.name}
          </p>
          <p className="text-xs text-white/30">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialSection() {
  return (
    <section className="py-[120px] bg-[#050508]" id="testimonials">
      <div className="container px-6 mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="text-[11px] font-medium tracking-[0.2em] text-white/50 uppercase">
                Testimonials
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-white mb-4">
              What Our{" "}
              <span
                className="italic font-normal"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Clients Say
              </span>
            </h2>
            <p className="text-white/35 text-[15px] leading-relaxed max-w-lg mx-auto">
              Trusted by innovative teams to deliver exceptional customer
              experiences at scale.
            </p>
          </motion.div>
        </div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
