"use client";

import React from 'react';
import Image from 'next/image';
import { Instagram, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full min-h-[900px] flex flex-col items-center justify-center overflow-hidden bg-[#050508]"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source
            src="https://framerusercontent.com/assets/1g8IkhtJmlWcC4zEYWKUmeGWzI.mp4"
            type="video/mp4"
          />
        </video>
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-transparent to-[#050508] z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(27,38,59,0.4)_0%,transparent_70%)] z-[5]" />
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[#050508] to-transparent z-[15]" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 flex items-center justify-center">

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center text-center max-w-[800px]">

          {/* Top Logo / Branding Marker */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="glass-card p-4 rounded-2xl flex items-center justify-center border-[rgba(255,255,255,0.08)] bg-[rgba(13,14,18,0.7)]">
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#050508]" />
              </div>
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span className="text-[12px] font-medium tracking-wider text-white uppercase opacity-90">
              New Gen AI Automation Partner
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="max-w-5xl mb-6 text-center leading-[1.1] tracking-[-0.02em] font-bold"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <span className="bg-gradient-to-b from-white to-[#999999] bg-clip-text text-fill-transparent">
              Automate Smarter. Grow Faster.
            </span>
            <br />
            <motion.span
              className="font-serif-italic italic font-normal text-white inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
            >
              With AI.
            </motion.span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="max-w-2xl mb-12 text-lg md:text-xl text-[#999999] font-normal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          >
            AI Automation for Modern Businesses Made Simple
          </motion.p>

          {/* CTA Button */}
          <motion.div
            className="relative group"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />

            <a
              href="https://framer.link/D4dc7gs"
              className="relative flex items-center justify-center gap-2 h-14 px-10 rounded-full bg-white text-[#050508] font-semibold text-base transition-transform duration-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)] overflow-hidden"
            >
              <span>Book A Free Call</span>
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>

              <div className="absolute inset-0 border border-white/50 rounded-full pointer-events-none" />
            </a>
          </motion.div>

          {/* Social Links */}
          <motion.div
            className="mt-16 flex items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          >
            <a
              href="https://x.com/home"
              className="text-white opacity-40 hover:opacity-100 transition-opacity"
              aria-label="Twitter"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <div className="w-[1px] h-4 bg-white/10" />
            <a
              href="https://www.instagram.com/"
              className="text-white opacity-40 hover:opacity-100 transition-opacity"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
            <div className="w-[1px] h-4 bg-white/10" />
            <a
              href="https://www.facebook.com/"
              className="text-white opacity-40 hover:opacity-100 transition-opacity"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </a>
          </motion.div>
        </div>

      </div>

      {/* Decorative Border & Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Scroll Down Arrow Indicator */}
      <motion.div
        className="absolute bottom-12 z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2, ease: "easeOut" }}
      >
        <motion.a
          href="#founder-note"
          className="text-white/30 hover:text-white transition-colors block"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </motion.a>
      </motion.div>
    </section>
  );
}
