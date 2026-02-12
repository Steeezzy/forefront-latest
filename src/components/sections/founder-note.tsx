"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const FounderNote = () => {
  return (
    <section 
      id="founder-note"
      className="relative w-full py-[120px] flex flex-col items-center overflow-hidden bg-[#050508]"
      style={{
        backgroundColor: '#050508',
      }}
    >
      {/* Background Shape/Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(27, 38, 59, 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="container relative z-10 flex flex-col items-center max-w-[1200px]">
        {/* Badge */}
        <motion.div 
          className="mb-10 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 glass-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white/60"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
            <polyline points="7.5 19.79 7.5 14.6 3 12" />
            <polyline points="21 12 16.5 14.6 16.5 19.79" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span 
            className="text-[12px] font-medium tracking-[0.1em] text-white uppercase"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            WE ANALYZE YOUR DATA
          </span>
        </motion.div>

        {/* Quote Section */}
        <motion.div 
          className="max-w-[1000px] text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <h3 
            className="text-[32px] md:text-[42px] leading-[1.3] text-white font-serif-italic"
            style={{ 
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400
            }}
          >
            &ldquo;We find what to <span className="text-white underline decoration-white/20 underline-offset-8">automate</span>, who your users are &amp; how AI can optimize your <span className="text-white underline decoration-white/20 underline-offset-8">workflow</span>. Best part is we also build and launch <span className="text-white underline decoration-white/20 underline-offset-8">real solutions</span>.&rdquo;
          </h3>
        </motion.div>

        {/* Founder Profile */}
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="relative mb-4 w-[64px] h-[64px] rounded-full overflow-hidden border border-white/10">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/W7xYkGKzPzvnPv58ZBNzxS3JZI-1.jpg"
              alt="Ikta Sollork - Founder"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="text-center">
            <h4 
              className="text-white text-[18px] font-semibold mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ikta Sollork
            </h4>
            <p 
              className="text-[#999999] text-[15px]"
              style={{ fontFamily: 'var(--font-sans)', color: '#999999' }}
            >
              Co-founder &amp; AI Strategy Lead
            </p>
          </div>
        </motion.div>
      </div>

      {/* Decorative Border Line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Subtle Bottom Glow Overlay */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[150px] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(5, 5, 8, 1), transparent)',
        }}
      />
    </section>
  );
};

export default FounderNote;
