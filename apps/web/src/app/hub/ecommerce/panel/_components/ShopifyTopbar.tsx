'use client';

import Link from 'next/link';
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

export function ShopifyTopbar() {
  return (
    <header className="fixed top-0 left-[200px] right-0 h-12 bg-[#1a1a1a] flex items-center gap-3 px-4 z-30">
      {/* Shopify logo */}
      <Link href="/hub/ecommerce/panel" className="flex items-center gap-1.5 mr-2">
        <div className="w-6 h-6 flex items-center justify-center">
          <svg viewBox="0 0 109 124" fill="none" className="w-5 h-5">
            <path d="M74.7 14.8s-.3-1.4-1.4-2c-.8-.5-1.8-.3-2.7-.1l-3.8.8C65.5 9.8 63 5 59.2 5c-.2 0-.4 0-.6.1C57.2 3.4 55.8 3 54.5 3c-9.7 0-14.4 12.1-15.9 18.3l-7 2.2c-2.1.7-2.2.7-2.5 2.7L23.4 90l47.3 8.9 25.6-5.6L74.7 14.8z" fill="#95BF47"/>
            <path d="M70.6 12.7l-3.8.8C65.5 9.8 63 5 59.2 5c-.2 0-.4 0-.6.1-1.4-1.7-2.8-2.1-4.1-2.1V98.9l25.6-5.6-11.9-78.6c0 0-.3-1.4-1.4-2-.6-.4-1.2-.3-1.8-.3l-4.4 2.3z" fill="#5E8E3E"/>
            <path d="M54.5 35.2l-3.2 9.5s-2.8-1.5-6.2-1.5c-5 0-5.3 3.1-5.3 3.9 0 4.3 11.2 5.9 11.2 16 0 7.9-5 13-11.8 13-8.1 0-12.2-5.1-12.2-5.1l2.2-7.1s4.2 3.6 7.8 3.6c2.3 0 3.3-1.8 3.3-3.2 0-5.6-9.2-5.8-9.2-15.1 0-7.8 5.6-15.3 16.9-15.3 4.3-.1 6.5 1.3 6.5 1.3z" fill="#FFF"/>
          </svg>
        </div>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-[#2d2d2d] text-gray-300 placeholder-gray-500 text-[13px] pl-8 pr-10 py-1.5 rounded-lg border border-[#3d3d3d] focus:outline-none focus:border-gray-500 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 bg-[#3d3d3d] px-1 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-auto">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2d2d2d] transition-colors">
          <Bell className="w-4 h-4 text-gray-400" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2d2d2d] transition-colors">
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex items-center gap-1.5 ml-1 px-2 py-1 rounded-lg hover:bg-[#2d2d2d] cursor-pointer transition-colors">
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-6 h-6' } }} />
          <span className="text-[12px] text-gray-300 hidden sm:block">My Store</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
