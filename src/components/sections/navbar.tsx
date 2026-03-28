import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

/**
 * Navbar component for Questron Agent website clone.
 * Features:
 * - Sticky blurred background
 * - Responsive container
 * - Original typography and spacing
 * - Clerk-aware auth buttons
 */
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
        className="w-full h-[64px] flex items-center justify-center border-b border-gray-200"
        style={{
          backgroundColor: 'transparent',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="container flex items-center justify-between h-full max-w-[1350px] px-10">

          {/* Logo Section */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-gray-900/10">
                <span className="text-white font-bold text-xs uppercase">Q</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">Questron Agent</span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-100"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-1.5 text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {/* Show Log in / Sign up when NOT signed in */}
            <SignedOut>
              <a
                href="/sign-in"
                className="px-3 py-1.5 text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900 hidden md:block"
              >
                Log in
              </a>
              <a
                href="/sign-up"
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#101728] text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-900/20 group"
              >
                <span className="text-[14px] font-semibold leading-none">
                  Sign up
                </span>
              </a>
            </SignedOut>

            {/* Show UserButton when signed in */}
            <SignedIn>
              <a
                href="/panel/dashboard"
                className="px-3 py-1.5 text-[14px] font-medium text-gray-600 transition-colors hover:text-gray-900 hidden md:block"
              >
                Go to Dashboard
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
          </div>

        </div>
      </header>

      {/* Responsive Overlay Gradient */}
      <div className="absolute top-[64px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Navbar;