"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const Benefits = () => {
  return (
    <section 
      id="benefits" 
      className="relative w-full py-[120px] overflow-hidden bg-[#050508]"
      style={{ isolation: 'isolate' }}
    >
      <div className="container mx-auto max-w-[1200px] px-6">
        {/* Section Header */}
        <motion.div 
          className="flex flex-col items-center text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-md">
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="opacity-70"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-[11px] font-bold tracking-[0.1em] text-white uppercase">BENEFITS</span>
          </div>

          <h2 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-white">
            Why Choose <span className="font-serif italic font-normal text-[48px]">Us?</span>
          </h2>
          
          <p className="text-[18px] text-[#999999] max-w-[600px] leading-[1.6]">
            Everything you need to automate, optimize, and scale
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Real-Time Intelligence Card */}
          <motion.div 
            className="group relative glass-card p-8 rounded-[16px] flex flex-col items-center text-center min-h-[340px] transition-all duration-300 hover:border-[rgba(255,255,255,0.2)]"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="mb-10 relative w-[120px] h-[100px] flex items-center justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-[3px] border-[rgba(255,255,255,0.08)] rounded-full border-t-[rgba(255,255,255,0.4)] rotate-[-45deg]"></div>
                <div className="absolute top-1/2 left-1/2 w-8 h-[2px] bg-white origin-left rotate-[-20deg] opacity-60"></div>
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[20px] font-semibold text-white tracking-tight">Real-Time Intelligence</h3>
              <p className="text-[16px] text-[#999999] leading-[1.5]">
                Access accurate, real-time data to drive smarter decisions
              </p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140px] h-[40px] bg-[#1b263b]/10 blur-[30px] rounded-full pointer-events-none group-hover:bg-[#1b263b]/20 transition-colors"></div>
          </motion.div>

          {/* Measurable Impact Card */}
          <motion.div 
            className="group relative glass-card p-8 rounded-[16px] flex flex-col items-center text-center min-h-[340px] transition-all duration-300 hover:border-[rgba(255,255,255,0.2)]"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="mb-10 relative flex items-end gap-1.5 h-[100px]">
              <div className="w-4 bg-[rgba(255,255,255,0.1)] rounded-sm h-10 group-hover:h-12 transition-all"></div>
              <div className="w-4 bg-[rgba(255,255,255,0.2)] rounded-sm h-16 group-hover:h-20 transition-all"></div>
              <div className="w-4 bg-[rgba(255,255,255,0.15)] rounded-sm h-12 group-hover:h-14 transition-all"></div>
              <div className="w-4 bg-[rgba(255,255,255,0.3)] rounded-sm h-20 group-hover:h-24 transition-all"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[20px] font-semibold text-white tracking-tight">Measurable Impact</h3>
              <p className="text-[16px] text-[#999999] leading-[1.5]">
                Track performance, uncover insights, and achieve data-backed growth
              </p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140px] h-[40px] bg-[#1b263b]/10 blur-[30px] rounded-full pointer-events-none group-hover:bg-[#1b263b]/20 transition-colors"></div>
          </motion.div>

          {/* Seamless Integration Card */}
          <motion.div 
            className="group relative glass-card p-8 rounded-[16px] flex flex-col items-center text-center min-h-[340px] transition-all duration-300 hover:border-[rgba(255,255,255,0.2)]"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="mb-10 relative w-[140px] h-[100px] flex items-center justify-center">
              <div className="relative scale-90 group-hover:scale-100 transition-transform duration-500">
                <Image 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/EdYwMQFSY0q3kCvKPrFpiTV5w.png"
                  alt="Seamless Integration"
                  width={147}
                  height={147}
                  className="object-contain opacity-80"
                />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[20px] font-semibold text-white tracking-tight">Seamless Integration</h3>
              <p className="text-[16px] text-[#999999] leading-[1.5]">
                Connect tools, teams, and workflows with intelligent automation
              </p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140px] h-[40px] bg-[#1b263b]/10 blur-[30px] rounded-full pointer-events-none group-hover:bg-[#1b263b]/20 transition-colors"></div>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1440px] pointer-events-none -z-10 flex justify-center items-center opacity-30">
        <div className="w-[800px] h-[400px] bg-[#1b263b] blur-[150px] rounded-full"></div>
      </div>
      
      {/* Bottom Border Line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[rgba(255,255,255,0.05)]"></div>
    </section>
  );
};

export default Benefits;
