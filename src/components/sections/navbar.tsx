'use client';
import React from 'react';
import Image from 'next/image';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';

const Navbar = () => {
  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'Process', href: '#process' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Dashboard', href: '/panel/dashboard' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] w-full flex justify-center">
      <header
        className="w-full h-16 flex items-center justify-center bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0] shadow-sm"
      >
        <div className="container flex items-center justify-between h-full max-w-[1200px] px-6">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#0a192f] flex items-center justify-center transition-all group-hover:scale-105 shadow-lg shadow-[#0a192f]/10">
                <span className="text-white font-bold text-sm tracking-tighter">Q</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0a192f]">Questron</span>
            </a>
          </motion.div>

          {/* Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-1 px-4 py-2 rounded-full border border-[#e2e8f0] bg-white/50"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0a192f]"
              >
                {link.name}
              </a>
            ))}
          </motion.nav>

          {/* Auth */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <SignedOut>
              <a
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0a192f] hidden md:block"
              >
                Log in
              </a>
              <a
                href="/sign-up"
                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0a192f] text-white transition-all hover:shadow-lg hover:shadow-[#0a192f]/20"
              >
                <span className="text-sm font-semibold">Sign up</span>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="w-4 h-4"
                />
              </a>
            </SignedOut>

            <SignedIn>
              <a
                href="/panel/dashboard"
                className="px-4 py-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0a192f] hidden md:block"
              >
                Dashboard
              </a>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>
          </motion.div>
        </div>
      </header>

      {/* Subtle divider */}
      <div className="absolute top-16 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e2e8f0]/50 to-transparent" />
    </div>
  );
};

export default Navbar;