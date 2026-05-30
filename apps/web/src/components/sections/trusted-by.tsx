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
      <div className="w-8 h-8 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center transition-colors group-hover:border-[#0a192f]/20 group-hover:bg-[#0a192f]/5">
        <span className="text-xs font-bold text-[#94a3b8] group-hover:text-[#0a192f] uppercase">{letter}</span>
      </div>
      <span className="text-lg font-bold text-[#94a3b8] group-hover:text-[#0a192f] transition-colors tracking-tight whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export default function TrustedBy() {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="container px-6 mx-auto max-w-[1200px] mb-10">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#e2e8f0] bg-[#fafbfc]">
            <span className="text-[11px] font-bold tracking-wide text-[#64748b] uppercase">
              Trusted By Industry Leaders
            </span>
          </div>
        </motion.div>
      </div>

      {/* Marquee row 1 - left to right */}
      <div className="relative w-full mb-6">
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent" />
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
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent" />
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
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent" />
      </div>
    </section>
  );
}
