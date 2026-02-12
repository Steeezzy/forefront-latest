"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const stories = [
  {
    id: 'max',
    title: "Max's SaaS Revolution",
    description: "Max, the founder of CloudFlow, implemented AI automation in their processes. This move slashed operational costs by 50% and boosted team productivity by 75%, empowering the company to accelerate growth and expand faster.",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/46yWpjkwWiKJojGTr2NKnNPtJ1c-3.jpg",
    metrics: [
      { value: "50%", label: "increase in ROI" },
      { value: "75%", label: "boost in revenue" }
    ]
  },
  {
    id: 'emily',
    title: "Emily's E-commerce Success",
    description: "Emily, the CEO of BloomTech, transformed their marketing efforts using AI-powered tools. This shift resulted in a 60% increase in ROI and a 45% improvement in customer personalization, leading to a surge in brand loyalty.",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/G1bC6MQnKLl8c7ZyjwpJlVGuw-6.jpg",
    metrics: [
      { value: "60%", label: "growth in sales" },
      { value: "45%", label: "rise in engagement" }
    ]
  },
  {
    id: 'sophia',
    title: "Sophia's Retail Breakthrough",
    description: "Sophia, the marketing lead at Trendify, used AI-driven analytics to dive deep into customer behavior. The insights led to a 40% increase in engagement and a 30% rise in repeat purchases, creating long-term customer relationships.",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/BgsxdPJJZ3faakDHp1W2WcB8CoM-7.jpg",
    metrics: [
      { value: "40%", label: "gain in retention" },
      { value: "30%", label: "surge in profits" }
    ]
  }
];

const SuccessStories = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-[120px] px-6 bg-[#050508] relative overflow-hidden" id="clients">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center">
        {/* Badge */}
        <motion.div 
          className="flex items-center gap-2 px-3 py-1 bg-[#16171d]/50 border border-white/10 rounded-full mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <User className="w-3.5 h-3.5 text-[#999999]" />
          <span className="text-[12px] font-medium tracking-wider text-[#999999] uppercase">Our Clients</span>
        </motion.div>

        {/* Section Heading */}
        <motion.h2 
          className="text-[48px] font-bold text-center mb-4 leading-[1.1] tracking-tight text-white"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
        >
          Success Stories to <span className="font-serif-italic opacity-80">Inspire</span>
        </motion.h2>
        <motion.p 
          className="text-[#999999] text-center text-[18px] mb-16 max-w-[600px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          Discover how businesses and creators achieve results
        </motion.p>

        {/* Carousel Container */}
        <motion.div 
          className="relative w-full max-w-[900px]"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Card Stack Visual (Background items) */}
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[85%] h-full bg-[#0d0e12]/40 rounded-[24px] border border-white/5 opacity-50 z-0 scale-[0.9]"></div>
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-[92.5%] h-full bg-[#0d0e12]/60 rounded-[24px] border border-white/5 opacity-80 z-1 scale-[0.95]"></div>

          {/* Main Card */}
          <div className="relative z-10 glass-card rounded-[24px] p-8 md:p-12 overflow-hidden">
            {/* Inner Header/Window controls style */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-white/40">
                <User size={18} />
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={activeIndex}
                className="grid md:grid-cols-2 gap-12 items-center"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <div>
                  <h3 className="text-[32px] font-semibold text-white mb-6 leading-tight">
                    {stories[activeIndex].title}
                  </h3>
                  <p className="text-[#999999] text-[16px] leading-[1.6] mb-10">
                    {stories[activeIndex].description}
                  </p>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {stories[activeIndex].metrics.map((metric, idx) => (
                      <motion.div 
                        key={idx} 
                        className="bg-[#16171d]/50 border border-white/5 rounded-[16px] p-6 text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                      >
                        <div className="text-[32px] font-bold text-white mb-1">
                          {metric.value}
                        </div>
                        <div className="text-[12px] text-[#999999] leading-tight">
                          {metric.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Image Area */}
                <div className="relative">
                  <div className="aspect-[4/3] rounded-[16px] overflow-hidden border border-white/10">
                    <Image
                      src={stories[activeIndex].image}
                      alt={stories[activeIndex].title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Pagination */}
          <div className="flex justify-center items-center gap-3 mt-12 mb-20 relative z-20">
            {stories.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx ? 'bg-white w-2.5' : 'bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Strategic Quote Below */}
        <motion.div 
          className="max-w-[800px] mt-8 text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <h3 className="font-serif-italic text-[28px] md:text-[36px] text-[#999999] leading-relaxed">
            &ldquo;They listened to our needs, focused on our audience, and gave our brand a competitive edge. Their approach was strategic and highly effective!&rdquo;
          </h3>
        </motion.div>
      </div>

      {/* Background Decorative Element */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#1b263b]/15 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
    </section>
  );
};

export default SuccessStories;
