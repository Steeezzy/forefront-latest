'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headphones, LogOut, User } from 'lucide-react';

const navLinks = [
  { href: '/support', label: 'Dashboard' },
  { href: '/support/tickets', label: 'Tickets' },
  { href: '/support/clients', label: 'Clients' },
  { href: '/support/onboarding', label: 'Onboarding' },
];

export default function SupportInnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/support') return pathname === '/support';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-gray-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm tracking-tight">Qestron Support</span>
              <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
                Internal
              </span>
            </div>

            {/* Center nav */}
            <div className="flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right: agent info */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline">Support Agent</span>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
