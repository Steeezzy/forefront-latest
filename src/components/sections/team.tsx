"use client";

import React from 'react';
import Image from 'next/image';
import { Twitter, Instagram, Linkedin } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  socials: {
    twitter: string;
    instagram: string;
    linkedin: string;
  };
}

const teamMembers: TeamMember[] = [
  {
    name: 'Jenny Will',
    role: 'SEO / Others',
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/meD9qS8xpKRajRR77S85wY5Mv8A-14.jpg',
    socials: { twitter: '#', instagram: '#', linkedin: '#' },
  },
  {
    name: 'Jan Wink',
    role: 'Integration Specialist',
    image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/6558ee34-fe52-46ae-a9eb-33fd799a2715-landio-framer-website/assets/images/XNaoO5zh0Xr50RaXTmjSPo-17.jpg',
    socials: { twitter: '#', instagram: '#', linkedin: '#' },
  },
  {
    name: 'Lilli Math',
    role: 'Client Manager',
    image: 'https://framerusercontent.com/images/W7xYkGKzPzvnPv58ZBNzxS3JZI.jpg?width=4000&height=4000',
    socials: { twitter: '#', instagram: '#', linkedin: '#' },
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const TeamMemberCard = ({ member }: { member: TeamMember }) => (
  <div className="glass-card rounded-[20px] p-6 flex items-center justify-between border border-white/10 bg-[#0d0e12]/70 backdrop-blur-md group hover:border-white/20 transition-all duration-300">
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h4 className="text-[18px] font-semibold text-white leading-tight">
          {member.name}
        </h4>
        <p className="text-[14px] text-[#999999] font-medium uppercase tracking-wider">
          {member.role}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={member.socials.twitter}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#999999] hover:text-white hover:bg-white/10 transition-colors"
        >
          <Twitter size={14} />
        </a>
        <a
          href={member.socials.instagram}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#999999] hover:text-white hover:bg-white/10 transition-colors"
        >
          <Instagram size={14} />
        </a>
        <a
          href={member.socials.linkedin}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#999999] hover:text-white hover:bg-white/10 transition-colors"
        >
          <Linkedin size={14} />
        </a>
      </div>
    </div>
    <div className="relative w-[100px] h-[100px] overflow-hidden rounded-xl border border-white/10">
      <Image
        src={member.image}
        alt={member.name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="100px"
      />
    </div>
  </div>
);

const TeamSection = () => {
  return (
    <section className="relative py-[120px] overflow-hidden" id="team">
      <div className="container relative z-10">
        <motion.div
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[12px] font-bold text-white tracking-[0.1em] uppercase">
              OUR AMAZING TEAM
            </span>
          </div>

          <h2 className="mb-4 text-balance">
            Get to Know <span className="font-serif-italic">Us</span>
          </h2>

          <p className="max-w-[600px] text-[18px] text-[#999999] text-balance">
            Everything you need to collaborate, create, and scale, all in one place.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1100px] mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <TeamMemberCard member={member} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20 hero-glow" />
    </section>
  );
};

export default TeamSection;
