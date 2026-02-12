"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqData = [
  {
    question: "What types of processes can you automate?",
    answer:
      "We specialize in automating repetitive workflows across operations, marketing, sales, and customer support using AI and custom logic.",
  },
  {
    question: "Do I need technical knowledge to use your service?",
    answer:
      "Not at all. Our team handles the setup, integration, and optimization. You just focus on your goals \u2014 we\u2019ll automate the rest.",
  },
  {
    question: "Can you integrate with our existing tools?",
    answer:
      "Yes! We support integrations with CRMs, project management tools, communication apps, and more \u2014 tailored to your stack.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Most clients see their first automation live within 1\u20132 weeks, depending on complexity and the number of workflows.",
  },
  {
    question: "Is your AI secure and compliant?",
    answer:
      "Absolutely. We use enterprise-grade security practices and ensure compliance with major data privacy standards like GDPR.",
  },
];

const FAQItem = ({
  question,
  answer,
  isOpen,
  onClick,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}) => {
  return (
    <motion.div
      className={`group mb-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d0e12] transition-all duration-300 hover:border-white/20 ${
        isOpen ? "border-white/20" : ""
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as const }}
    >
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors"
      >
        <span className="text-[16px] font-medium text-white sm:text-[18px]">
          {question}
        </span>
        <div className="ml-4 flex h-6 w-6 items-center justify-center">
          <ChevronDown
            className={`h-5 w-5 text-[#999999] transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-6 py-5 text-[15px] leading-relaxed text-[#999999]">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="w-full bg-[#050508] py-[120px]">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          className="mb-20 flex flex-col items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="mb-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <HelpCircle className="h-4 w-4 text-[#999999]" />
            <span className="text-[12px] font-semibold tracking-[0.05em] text-[#999999] uppercase">
              FAQ&apos;s
            </span>
          </div>
          <h2 className="text-center text-[40px] font-bold tracking-tight text-white md:text-[48px]">
            Frequently Asked <span className="font-serif italic font-normal text-white">Questions</span>
          </h2>
          <p className="mt-4 text-center text-[18px] text-[#999999]">
            Find quick answers to the most common support questions
          </p>
        </motion.div>

        {/* FAQ Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
          {/* Support Card */}
          <div className="flex justify-center lg:block">
            <motion.div 
              className="sticky top-24 h-fit w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#0d0e12] p-8 text-center glass-card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Plus className="h-6 w-6 text-[#999999]" />
                </div>
              </div>
              <h3 className="mb-3 text-[22px] font-bold text-white">
                Still Have Questions?
              </h3>
              <p className="mb-8 text-[15px] leading-relaxed text-[#999999]">
                Still have questions? Feel free to get in touch with us today!
              </p>
              <a
                href="#contact"
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-[#16171d] px-6 py-3.5 text-[15px] font-semibold text-white transition-all hover:border-white/20 active:scale-[0.98]"
              >
                <div className="absolute inset-0 translate-y-full bg-white transition-transform group-hover:translate-y-0" />
                <span className="relative z-10 group-hover:text-black">Ask A Question</span>
                <svg
                  className="relative z-10 ml-1.5 h-3.5 w-3.5 rotate-[-45deg] transition-transform group-hover:text-black"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            </motion.div>
          </div>

          {/* FAQ Accordion */}
          <div className="w-full">
            {faqData.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Background Decorative Element */}
      <div className="pointer-events-none absolute -left-1/4 top-1/2 -z-10 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[#1b263b]/10 blur-[120px]" />
    </section>
  );
};

export default FAQSection;
