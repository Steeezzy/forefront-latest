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
      className={`group mb-3 overflow-hidden rounded-2xl border transition-all duration-300 ${
        isOpen ? "border-[#101728]/10 bg-gray-50/50 shadow-lg shadow-gray-100/50" : "border-gray-100 bg-white hover:border-gray-200"
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
        <span className="text-[16px] font-medium text-gray-900 sm:text-[18px]">
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
            <div className="border-t border-gray-100 px-6 py-5 text-[15px] leading-relaxed text-gray-500 font-medium">
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
    <section id="faq" className="w-full bg-[#ffffff] py-[120px]">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          className="mb-20 flex flex-col items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-gray-100 bg-gray-50/50">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#101728]/50 uppercase">
              Frequently Asked Questions
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-[#101728] mb-4 text-center">
            Commonly Asked <span className="italic font-normal text-gray-400">Questions</span>
          </h2>
          <p className="text-gray-500 text-[15px] leading-relaxed max-w-lg text-center font-medium">
            Find quick answers to the most common support questions
          </p>
        </motion.div>

        {/* FAQ Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
          {/* Support Card */}
          <div className="flex justify-center lg:block">
            <motion.div 
              className="sticky top-24 h-fit w-full max-w-[360px] rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-2xl shadow-gray-100"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101728]/5 border border-[#101728]/10">
                  <Plus className="h-6 w-6 text-[#101728]" />
                </div>
              </div>
              <h3 className="mb-3 text-[22px] font-bold text-[#101728]">
                Still Have Questions?
              </h3>
              <p className="mb-8 text-[15px] pb-2 leading-relaxed text-gray-400 font-medium border-b border-gray-100/50">
                Can&apos;t find what you&apos;re looking for? Reach out to our team today.
              </p>
              <a
                href="#contact"
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#101728] px-6 py-4 text-[15px] font-bold text-white transition-all hover:bg-gray-800 active:scale-[0.98] shadow-lg shadow-gray-900/10"
              >
                <span>Ask A Question</span>
                <svg
                  className="ml-1.5 h-3.5 w-3.5 rotate-[-45deg]"
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
      <div className="pointer-events-none absolute -left-1/4 top-1/2 -z-10 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[#f3f4f6]/10 blur-[120px]" />
    </section>
  );
};

export default FAQSection;
