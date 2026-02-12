"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcessSteps() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      number: "01",
      title: "Discover & Analyze",
      description:
        "We audit your existing workflows, tools, and customer data to uncover inefficiencies and automation opportunities. Every system is mapped for clarity.",
      image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/TXdiLXbrEnofSFENzswfxpdKpc-5.png",
    },
    {
      id: 2,
      number: "02",
      title: "Strategize & Design",
      description:
        "Based on our findings, we create a bespoke automation roadmap tailored to your business goals, selecting the best AI tools and integration points.",
      image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/TXdiLXbrEnofSFENzswfxpdKpc-5.png",
    },
    {
      id: 3,
      number: "03",
      title: "Build & Launch",
      description:
        "Our engineers develop and deploy your custom AI solutions, ensuring seamless integration with your current stack and providing team training.",
      image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/TXdiLXbrEnofSFENzswfxpdKpc-5.png",
    },
  ];

  return (
    <section id="process" className="py-[120px] bg-[#050508] overflow-hidden">
      <div className="container mx-auto px-6 max-w-[1240px]">
        {/* Header Section */}
        <motion.div 
          className="flex flex-col items-center text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm self-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="opacity-70"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
              Process
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Our Simple & <span className="text-white/60">Smart Process</span>
          </h2>
          <p className="text-[#999999] text-base md:text-lg max-w-2xl font-normal">
            Everything you need to collaborate, create, and scale, all in one place.
          </p>
        </motion.div>

        {/* Outer Container with Border */}
        <motion.div 
          className="relative rounded-[32px] border border-white/[0.08] bg-[#0D0E12]/40 backdrop-blur-xl p-8 md:p-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Tab Navigation */}
          <div className="grid grid-cols-3 gap-1 mb-16 md:mb-20">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={`relative py-4 px-2 text-[11px] font-bold tracking-[0.1em] uppercase transition-all duration-300 rounded-xl flex items-center justify-center ${
                  activeStep === step
                    ? "bg-white/[0.06] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.08]"
                    : "text-white/40 hover:text-white/60 border border-transparent"
                }`}
              >
                STEP {step}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[400px]">
            {/* Visual Mockups Column */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeStep}
                className="relative group"
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <div className="relative z-10">
                  <Image
                    src={steps[activeStep - 1].image}
                    alt={`Process Step ${activeStep} Illustration`}
                    width={600}
                    height={450}
                    className="w-full h-auto rounded-2xl shadow-2xl"
                  />
                </div>
                
                {/* Animated Glow Behind Image */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-[80px] -z-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(27, 38, 59, 0.3) 0%, transparent 70%)' }} />
              </motion.div>
            </AnimatePresence>

            {/* Transitioning Text Column */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeStep}
                className="flex flex-col space-y-6 md:pl-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <div className="flex flex-col space-y-4">
                  <span className="text-[#999999] font-mono text-sm tracking-widest">
                    {steps[activeStep - 1].number}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                    {steps[activeStep - 1].title}
                  </h3>
                  <p className="text-[#999999] text-lg leading-relaxed font-normal max-w-md">
                    {steps[activeStep - 1].description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
