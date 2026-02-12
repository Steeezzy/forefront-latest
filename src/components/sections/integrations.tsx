"use client";

import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } }
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { 
    opacity: 1, scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const Integrations = () => {
  const integrations = [
    { name: 'Facebook' }, { name: 'Pinterest' }, { name: 'Framer' }, { name: 'X' }, { name: 'Dribbble' },
    { name: 'Contact' }, { name: 'Layers' }, { name: 'Instagram' }, { name: 'Chrome' }, { name: 'User' },
    { name: 'PayPal' }, { name: 'Cloud' }, { name: 'Notion' }, { name: 'Slack' }, { name: 'Payment' },
  ];

  return (
    <section className="py-[120px] bg-[#050508] relative overflow-hidden flex flex-col items-center justify-center">
      <div className="container max-w-[1200px] px-6 mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div 
          className="flex flex-col items-center mb-[60px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(13,14,18,0.7)] mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-80">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span className="text-[11px] font-semibold tracking-wider text-white opacity-90 uppercase">Integrations</span>
          </div>

          <h2 className="text-[48px] font-bold text-white mb-4 text-center leading-[1.1] tracking-tight">
            Seamless <span className="font-serif italic font-normal">Integrations</span>
          </h2>

          <p className="text-[18px] text-[#999999] text-center max-w-[600px] leading-relaxed">
            Interact with all your favorite software without unnecessary fuss
          </p>
        </motion.div>

        {/* Integration Grid Container */}
        <motion.div 
          className="relative mx-auto max-w-[800px]"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="glass-card rounded-[24px] p-[40px] md:p-[64px] border border-[rgba(255,255,255,0.08)] bg-[rgb(13,14,18)] flex flex-col items-center">
            
            <motion.div 
              className="grid grid-cols-5 gap-y-12 gap-x-12 md:gap-x-16"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              {integrations.map((item, index) => (
                <motion.div 
                  key={index} 
                  className="w-12 h-12 md:w-14 md:h-14 bg-[#16171D] rounded-[14px] border border-[rgba(255,255,255,0.08)] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-[#1b263b] transition-colors duration-300 group cursor-pointer"
                  variants={iconVariants}
                  whileHover={{ scale: 1.15, transition: { duration: 0.2 } }}
                >
                  <div className="text-white opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>

          <motion.div 
            className="mt-12 flex justify-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-[#999999] text-[15px] italic text-center max-w-[500px]">
              &ldquo;Our AI automation plugs into your stack to create a unified, intelligent workflow&rdquo;
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgba(27,38,59,0.15)] blur-[120px] rounded-full pointer-events-none -z-1"></div>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent"></div>
    </section>
  );
};

export default Integrations;
