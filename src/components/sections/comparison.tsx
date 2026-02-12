"use client";

import React from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const ComparisonSection: React.FC = () => {
  const forefrontAgentFeatures = [
    "Fast setup with ready AI workflows",
    "Built to grow and adapt with you",
    "Real-time, AI-powered analytics",
    "Automates tasks, reducing overhead",
    "Expert support + AI guidance"
  ];

  const competitorFeatures = [
    "Slower execution and manual setup",
    "Requires manual updates as you scale",
    "Limited or delayed reporting",
    "Higher labor costs, less automation",
    "Generic support or none at all"
  ];

  const listItemVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: (i: number) => ({
      opacity: 1, x: 0,
      transition: { duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const }
    })
  };

  return (
    <section className="relative w-full py-[120px] px-6 bg-[#050508] overflow-hidden" id="comparison">
      {/* Background Glow Effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(27, 38, 59, 0.4) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Header Section */}
        <motion.div
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(13,14,18,0.7)] backdrop-blur-md mb-6">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#999999]"
            >
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            <span className="text-[12px] font-bold tracking-widest text-[#999999] uppercase">COMPARISON</span>
          </div>

          <h2 className="text-[48px] font-semibold tracking-tight text-white mb-4">
            Why Choose Us <span className="font-serif italic font-normal text-white">Over Others</span>
          </h2>

          <p className="text-[18px] text-[#999999] max-w-[600px] leading-relaxed">
            See how we compare against others in performance, growth
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">

          {/* Forefront Agent Column */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#050508]" />
              </div>
              <span className="text-[20px] font-semibold text-white">Forefront Agent</span>
            </div>

            <div className="flex-1 glass-card rounded-[16px] p-8 border border-[rgba(255,255,255,0.08)] bg-[rgba(13,14,18,0.4)] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <ul className="space-y-0">
                {forefrontAgentFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className={`flex items-center gap-4 py-5 ${index !== forefrontAgentFeatures.length - 1 ? 'border-b border-[rgba(255,255,255,0.05)]' : ''}`}
                    custom={index}
                    variants={listItemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-[16px] text-white font-medium">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Competitors Column */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#999999]">
                  <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                  <path d="M12 12l8-4.5" />
                  <path d="M12 12v9" />
                  <path d="M12 12L4 7.5" />
                </svg>
              </div>
              <span className="text-[20px] font-semibold text-[#999999] font-serif italic">Others</span>
            </div>

            <div className="flex-1 rounded-[16px] p-8 border border-[rgba(255,255,255,0.04)] bg-[rgba(13,14,18,0.2)] backdrop-blur-sm grayscale opacity-60 transition-opacity hover:opacity-100">
              <ul className="space-y-0">
                {competitorFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className={`flex items-center gap-4 py-5 ${index !== competitorFeatures.length - 1 ? 'border-b border-[rgba(255,255,255,0.03)]' : ''}`}
                    custom={index}
                    variants={listItemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <X className="w-4 h-4 text-[#999999]" strokeWidth={2} />
                    </div>
                    <span className="text-[16px] text-[#999999]">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent" />
    </section>
  );
};

export default ComparisonSection;
