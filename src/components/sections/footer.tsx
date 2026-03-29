"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Twitter, Linkedin, Github, ArrowUpRight } from "lucide-react";

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "America/New_York",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="tabular-nums">{time || "--:--:-- --"}</span>;
}

const footerLinks = {
  Services: [
    { label: "Live Chat", href: "/#services" },
    { label: "AI Chatbot", href: "/#services" },
    { label: "Ticketing", href: "/#services" },
    { label: "Automation", href: "/#services" },
    { label: "Knowledge Base", href: "/#services" },
    { label: "Analytics", href: "/#services" },
  ],
  Solutions: [
    { label: "E-Commerce", href: "/#case-studies" },
    { label: "SaaS", href: "/#case-studies" },
    { label: "Healthcare", href: "/#case-studies" },
    { label: "FinTech", href: "/#case-studies" },
    { label: "Enterprise", href: "/#case-studies" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "Blog", href: "/blog" },
    { label: "Changelog", href: "/changelog" },
    { label: "Status", href: "/status" },
  ],
};

// Removed CTAParallaxVideo to maintain minimalist, high-performance design


export default function Footer() {
  return (
    <footer className="w-full bg-[#0a192f] text-white overflow-hidden">
      {/* CTA Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center px-6 overflow-hidden bg-gradient-to-b from-[#0a192f] to-[#112240]">
        {/* Removed CTAParallaxVideo */}

        {/* Dark overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#0a192f]/50 via-[#0a192f]/40 to-[#0a192f]/50" style={{ zIndex: 1 }} />

        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
            style={{
              background:
                "radial-gradient(ellipse at center bottom, rgba(59,130,246,0.06) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-20 max-w-[1200px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, #ffffff 20%, #a5b4fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                We turn bold ideas into
              </span>
              <br />
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, #ffffff 10%, #a5b4fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                powerful <span className="italic font-normal" style={{ color: "#fff" }}>digital realities</span>
              </span>
            </h2>

            <p className="text-white/40 text-lg mb-10 max-w-lg mx-auto">
              Ready to transform your customer experience? Let's build
              something extraordinary together.
            </p>

            <Link
              href="/sign-up"
              className="group relative inline-flex items-center gap-2.5 h-14 px-10 rounded-full bg-white text-[#0a192f] font-semibold text-base transition-all duration-300 hover:scale-[1.03] shadow-2xl overflow-hidden"
            >
              <span className="relative z-10">Start Your Project</span>
              <ArrowUpRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="max-w-[1200px] mx-auto px-6 border-t border-white/10 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-[#0a192f] text-sm font-bold uppercase">Q</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                Questron
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-6">
              AI-powered customer platform that helps businesses deliver
              exceptional support at scale.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {[
                { Icon: Twitter, href: "https://x.com" },
                { Icon: Linkedin, href: "https://linkedin.com" },
                { Icon: Github, href: "https://github.com" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="md:col-span-2">
              <h4 className="text-xs font-medium tracking-wider text-white/40 uppercase mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Location + Clock */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-medium tracking-wider text-white/40 uppercase mb-5">
              Contact
            </h4>
            <div className="space-y-4 text-sm text-white/40">
              <div>
                <p className="text-white/50 mb-1">Location</p>
                <p>New York, NY</p>
              </div>
              <div>
                <p className="text-white/50 mb-1">Local Time</p>
                <p className="font-mono text-white/60">
                  <LiveClock />
                </p>
              </div>
              <div>
                <p className="text-white/50 mb-1">Email</p>
                <a
                  href="mailto:hello@forefront.ai"
                  className="hover:text-white transition-colors"
                >
                  hello@forefront.ai
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/5">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} Questron Agent. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/20">
            <a href="/privacy" className="hover:text-white/50 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-white/50 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
