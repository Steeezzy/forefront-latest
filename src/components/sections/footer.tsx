"use client";

import React from 'react';
import Image from 'next/image';
import { Twitter, Instagram, Facebook, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const navLinks = [
    { label: 'Services', href: '/#services' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ];

  return (
    <footer className="w-full bg-[#050508] text-white selection:bg-accent/30 overflow-hidden">
      {/* CTA Section */}
      <section className="relative pt-[120px] pb-[160px] flex flex-col items-center justify-center text-center px-6">
        {/* Subtle Glow Effect */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none hero-glow opacity-40"
          style={{ background: 'radial-gradient(50% 50% at 50% 100%, rgba(27, 38, 59, 0.4) 0%, transparent 100%)' }}
        />
        
        <motion.div
          className="flex items-center gap-3 mb-6 relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="h-[1px] w-12 bg-border"></div>
          <span className="text-[12px] font-medium tracking-[0.2em] text-[#999999] uppercase">Reach out anytime</span>
          <div className="h-[1px] w-12 bg-border"></div>
        </motion.div>

        <motion.h2 
          className="text-[40px] md:text-[56px] font-bold tracking-tight leading-[1.1] mb-6 max-w-[800px] text-balance"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
        >
          Ready to Automate Smarter? Let&rsquo;s <span className="font-serif-italic">Build Together</span>
        </motion.h2>

        <motion.p 
          className="text-[#999999] text-[18px] mb-10 max-w-[500px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          Schedule a Call and Begin Automating
        </motion.p>

        <motion.div 
          className="relative group"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="absolute inset-0 bg-[#ffffff] opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 rounded-full" />
          <a
            href="https://framer.link/D4dc7gs"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-black font-semibold rounded-full transition-all duration-300 hover:scale-[1.02] relative z-10"
          >
            Book A Free Call
            <svg 
              className="ml-2 w-4 h-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>
        </motion.div>
      </section>

      {/* Main Footer navigation */}
      <motion.div 
        className="max-width-[1200px] mx-auto px-6 border-t border-white/10 pt-16 pb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          {/* Logo & Links */}
          <div className="flex flex-col gap-10">
            <div className="flex items-center gap-2">
              <Image 
                src="https://framerusercontent.com/images/04vJJZ3D2ponPv6rzLBq6sf2PZU.svg"
                alt="Forefront Agent Logo"
                width={103}
                height={39}
                className="brightness-100"
              />
            </div>
            
            <nav className="flex flex-wrap gap-x-8 gap-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[14px] text-[#999999] hover:text-white transition-colors duration-200 font-medium"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-5">
            <a href="https://x.com" className="text-[#999999] hover:text-white transition-colors">
              <Twitter size={20} strokeWidth={1.5} />
            </a>
            <a href="https://facebook.com" className="text-[#999999] hover:text-white transition-colors">
              <Facebook size={20} strokeWidth={1.5} />
            </a>
            <a href="https://instagram.com" className="text-[#999999] hover:text-white transition-colors">
              <Instagram size={20} strokeWidth={1.5} />
            </a>
            <a href="#" className="text-[#999999] hover:text-white transition-colors">
              <Globe size={20} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Legal & Bottom Stuff */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-16 pt-10 border-t border-white/5 border-dashed">
          <div className="text-[13px] text-[#666666]">
            &copy; {new Date().getFullYear()} Forefront Agent Template
          </div>
          
          <div className="flex items-center gap-10 text-[13px] text-[#666666]">
            <div className="flex items-center gap-1">
              Made by <span className="text-[#999999]">Framebase</span>
            </div>
            <a href="mailto:forefront agent@support.com" className="hover:text-white transition-colors">
              forefront agent@support.com
            </a>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
