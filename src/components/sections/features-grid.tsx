"use client";

import React from 'react';
import { Workflow, Cpu, Bot, Megaphone, BarChart3, Puzzle } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Workflow,
    title: "Workflow Automation",
    description: "Automate complex business processes to boost speed, clarity, and efficiency."
  },
  {
    icon: Cpu,
    title: "Custom AI Solutions",
    description: "Build tailored AI systems that align with your business goals and challenges."
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description: "Deploy intelligent virtual agents to streamline tasks."
  },
  {
    icon: Megaphone,
    title: "Sales & Marketing",
    description: "Leverage AI to optimize campaigns, track leads, and personalize outreach."
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    description: "Track automation results in real time to improve and scale your workflows."
  },
  {
    icon: Puzzle,
    title: "Seamless Integrations",
    description: "Connect your tools and apps for smooth, unified AI-powered workflows."
  }
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const FeaturesGrid = () => {
  return (
    <section className="py-[120px] bg-[#050508] relative overflow-hidden">
      <div className="container relative z-10">
        {/* Section Header */}
        <motion.div 
          className="flex flex-col items-center text-center mb-[64px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
            <div className="w-4 h-4 text-[#999999]">
              <Workflow size={14} />
            </div>
            <span className="text-[12px] font-semibold tracking-wider text-[#999999]">FEATURES</span>
          </div>
          <h2 className="text-[48px] font-bold text-white mb-4 leading-[1.1] tracking-tight">
            All features in <span className="font-serif-italic opacity-80">one place</span>
          </h2>
          <p className="text-[18px] text-[#999999] max-w-[600px] leading-[1.6]">
            Everything you need to automate operations, boost productivity
          </p>
        </motion.div>

        {/* Features 3x2 Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="group glass-card p-10 rounded-[16px] border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col items-center text-center"
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="w-[80px] h-[56px] bg-[#16171d] rounded-[12px] border border-white/5 flex items-center justify-center mb-8 shadow-inner">
                <feature.icon className="w-7 h-7 text-white opacity-90 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-[20px] font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-[16px] text-[#999999] leading-[1.6]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Background Decorative Element (Subtle Glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] hero-glow pointer-events-none opacity-40" />
    </section>
  );
};

export default FeaturesGrid;
