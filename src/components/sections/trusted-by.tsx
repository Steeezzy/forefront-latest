"use client";

import React from "react";
import { motion } from "framer-motion";

const trustedLogos = [
  { name: "Stripe", letter: "S" },
  { name: "Vercel", letter: "V" },
  { name: "Shopify", letter: "Sh" },
  { name: "Notion", letter: "N" },
  { name: "Slack", letter: "Sl" },
  { name: "Linear", letter: "L" },
  { name: "Figma", letter: "F" },
  { name: "GitHub", letter: "G" },
  { name: "Intercom", letter: "I" },
  { name: "HubSpot", letter: "H" },
  { name: "Zendesk", letter: "Z" },
  { name: "Salesforce", letter: "Sf" },
];

function LogoItem({ name, letter }: { name: string; letter: string }) {
  return (
    <div className="flex items-center gap-3 px-8 shrink-0 group">
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center transition-colors group-hover:border-[#101728]/20 group-hover:bg-[#101728]/5">
        <span className="text-xs font-bold text-[#101728]/20 group-hover:text-[#101728]/40 transition-colors uppercase">{letter}</span>
      </div>
      <span className="text-lg font-bold text-[#101728]/10 group-hover:text-[#101728]/20 transition-colors tracking-tight whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export default function TrustedBy() {
  return (
    <section className="py-20 bg-[#ffffff] overflow-hidden">
      <div className="container px-6 mx-auto max-w-[1200px] mb-12">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-100 bg-gray-50/50">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#101728]/40 uppercase">
              Trusted By Industry Leaders
            </span>
          </div>
        </motion.div>
      </div>

      {/* Marquee row 1 - left to right */}
      <div className="relative w-full mb-6">
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #ffffff, transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #ffffff, transparent)" }}
        />
        <div className="flex animate-marquee-left">
          <div className="flex shrink-0">
            {trustedLogos.map((logo, i) => (
              <LogoItem key={`a-${i}`} name={logo.name} letter={logo.letter} />
            ))}
          </div>
          <div className="flex shrink-0">
            {trustedLogos.map((logo, i) => (
              <LogoItem key={`b-${i}`} name={logo.name} letter={logo.letter} />
            ))}
          </div>
        </div>
      </div>

      {/* Marquee row 2 - right to left */}
      <div className="relative w-full">
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #ffffff, transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #ffffff, transparent)" }}
        />
        <div className="flex animate-marquee-right">
          <div className="flex shrink-0">
            {[...trustedLogos].reverse().map((logo, i) => (
              <LogoItem key={`c-${i}`} name={logo.name} letter={logo.letter} />
            ))}
          </div>
          <div className="flex shrink-0">
            {[...trustedLogos].reverse().map((logo, i) => (
              <LogoItem key={`d-${i}`} name={logo.name} letter={logo.letter} />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="container px-6 mx-auto max-w-[1200px] mt-16">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
    </section>
  );
}
