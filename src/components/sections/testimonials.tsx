"use client";

import React from 'react';
import Image from 'next/image';
import { Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "Daniel Kim",
    role: "Operations Lead at Flowbyte",
    content: "\u201CTruly impressive. The AI assistant is fast, accurate, and blends into our daily ops without friction.\u201D",
    avatar: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/XeoHxv0ErFoyqieN2PppKnGRd2o-8.jpg",
  },
  {
    name: "Priya Mehra",
    role: "CTO at Brightstack Labs",
    content: "\u201CGame-changer. Automation flows run flawlessly. Our team now focuses only on what really matters.\u201D",
    avatar: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/2brzgXS5fJHHMvAH83vgl5m8KTI-9.jpg",
  },
  {
    name: "Elena Rodriguez",
    role: "Product Manager at Nexora",
    content: "\u201CSmooth setup. Their system replaced three tools. We saw improvements in just the first week.\u201D",
    avatar: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/mCkhYgyE0LSy9RJ4nVmmGTpAjLA-10.jpg",
  },
  {
    name: "Marcus Thompson",
    role: "Marketing Director at OrbitShift",
    content: "\u201CSurprisingly simple. The AI adapts quickly. Our campaigns are now running 2x more efficiently.\u201D",
    avatar: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/YGV3hSM1KkFRZxZ0JDeOT7ry7u4-11.jpg",
  },
  {
    name: "Sarah Wong",
    role: "Analytics Manager at Corelink",
    content: "\u201CHuge time-saver. Data is better organized. The insights we get now are actionable and fast.\u201D",
    avatar: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/XeoHxv0ErFoyqieN2PppKnGRd2o-8.jpg",
  },
  {
    name: "Ravi Shah",
    role: "COO at PixelNest Solutions",
    content: "\u201CVery intuitive. No fluff, just performance. Our internal processes finally feel under control.\u201D",
    avatar: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/2brzgXS5fJHHMvAH83vgl5m8KTI-9.jpg",
  }
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => {
  return (
    <div className="flex flex-col p-6 rounded-[16px] glass-card border border-[rgba(255,255,255,0.08)] bg-[#0d0e12] transition-all duration-300 hover:border-[rgba(255,255,255,0.15)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-10 h-10 overflow-hidden rounded-full ring-1 ring-white/10">
          <Image
            src={testimonial.avatar}
            alt={testimonial.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <h4 className="text-white text-[15px] font-semibold leading-[1.2]">
            {testimonial.name}
          </h4>
          <span className="text-[#999999] text-[13px] font-medium mt-0.5">
            {testimonial.role}
          </span>
        </div>
      </div>
      
      <p className="text-[15px] leading-[1.6] text-[#999999] italic">
        {testimonial.content}
      </p>

      <div className="flex gap-1 mt-5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="fill-[#999999] text-[#999999]" />
        ))}
      </div>
    </div>
  );
};

export default function TestimonialSection() {
  return (
    <section className="relative py-[120px] px-6 bg-[#050508] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[600px] bg-[radial-gradient(circle,rgba(27,38,59,0.2)_0%,transparent_70%)] pointer-events-none" />

      <div className="container relative z-10 mx-auto max-w-[1200px]">
        {/* Section Header */}
        <motion.div 
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] mb-6">
            <Heart size={14} className="text-[#999999]" />
            <span className="text-[11px] font-semibold tracking-[0.1em] text-[#999999] uppercase">
              REVIEWS
            </span>
          </div>
          
          <h2 className="text-[48px] font-semibold tracking-tight text-white mb-4">
            Trusted by <span className="font-serif-italic">Visionaries</span>
          </h2>
          
          <p className="text-[18px] text-[#999999] max-w-[600px] mx-auto">
            Hear from real users who achieved success with our automation
          </p>
        </motion.div>

        {/* Testimonial Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
