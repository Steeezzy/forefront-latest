'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Tag, CreditCard, Truck, Globe, ArrowRight,
  Plus, Send, X, Package, Sparkles,
  BarChart3, ShoppingCart, Users, TrendingUp,
} from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const setupTasks = [
  {
    id: 'product',
    icon: Package,
    title: 'Add your first product',
    description: "Start by adding a product and a few key details. Not ready?",
    linkText: 'Start with a sample product',
    actions: [
      { label: 'Add product', primary: true },
      { label: 'Import', primary: false },
    ],
    img: null,
  },
  {
    id: 'theme',
    icon: Tag,
    title: 'Customize your online store',
    description: 'Choose or generate a custom theme, then add your logo, colors, and images.',
    actions: [{ label: 'Customize theme', primary: false }],
  },
];

const miniCards = [
  {
    icon: CreditCard,
    title: 'Set up a payment provider',
    desc: 'Accept payments from customers',
    action: 'Activate',
    logos: ['PayPal', 'Visa', 'MC'],
  },
  {
    icon: Truck,
    title: 'Review your shipping rates',
    desc: 'Make sure your rates are competitive',
    action: 'Review',
    logos: [],
  },
  {
    icon: Globe,
    title: 'Customize domain',
    desc: 'qestron.myshopify.com',
    action: 'Customize',
    badge: 'Get $20',
    logos: [],
  },
];

const stats = [
  { label: 'Total sales', value: '₹0', change: '', icon: TrendingUp },
  { label: 'Orders', value: '0', change: '', icon: ShoppingCart },
  { label: 'Customers', value: '0', change: '', icon: Users },
  { label: 'Conversion rate', value: '0%', change: '', icon: BarChart3 },
];

export default function EcommercePanelHome() {
  const { user } = useUser();
  const firstName = user?.firstName || 'there';
  const [prompt, setPrompt] = useState('');
  const [dismissBanner, setDismissBanner] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

      {/* Plan banner */}
      {!dismissBanner && (
        <div className="flex items-center justify-between bg-[#1a1a1a] text-white px-4 py-3 rounded-xl">
          <p className="text-sm">
            <span className="font-medium">Get 3 months for ₹20/month</span>
            <span className="text-gray-400 ml-2 text-xs">on the Basic plan — offer expires soon</span>
          </p>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Select a plan
            </button>
            <button onClick={() => setDismissBanner(true)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your store today.</p>
      </div>

      {/* AI prompt box */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg border border-[#e1e3e5] flex items-center justify-center hover:bg-gray-50 text-gray-400">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center hover:bg-gray-700 text-white disabled:opacity-40 transition-colors"
              disabled={!prompt}
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#e1e3e5] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">{s.label}</p>
                <Icon className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">No data yet</p>
            </div>
          );
        })}
      </div>

      {/* Store name setup */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e3e5]">
          <h2 className="text-[15px] font-semibold text-gray-900">Add store name</h2>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Tag className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 2-col setup cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#e1e3e5]">
          {/* Add product */}
          <div className="bg-white p-5">
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center mb-4 py-4">
                <div className="w-24 h-28 bg-[#f8f8f8] rounded-xl border-2 border-dashed border-[#e1e3e5] flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Add your first product</h3>
              <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
                Start by adding a product and a few key details. Not ready?{' '}
                <button className="text-blue-600 hover:underline">Start with a sample product</button>
              </p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                  Add product
                </button>
                <button className="px-4 py-2 border border-[#e1e3e5] text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Import
                </button>
              </div>
            </div>
          </div>

          {/* Customize theme */}
          <div className="bg-white p-5">
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center mb-4 py-4">
                <div className="relative w-28 h-28">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-6 h-6 bg-white/70 rounded" />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-lg border border-[#e1e3e5] flex items-center justify-center shadow-sm text-xs font-bold text-gray-400">
                    Aa
                  </div>
                </div>
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Customize your online store</h3>
              <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
                Choose or generate a custom theme, then add your logo, colors, and images.
              </p>
              <button className="self-start px-4 py-2 border border-[#e1e3e5] text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Customize theme
              </button>
            </div>
          </div>
        </div>

        {/* Mini setup cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e1e3e5]">
          {/* Payment */}
          <div className="bg-white p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex gap-1">
                <div className="w-7 h-4 bg-blue-700 rounded text-white text-[8px] flex items-center justify-center font-bold">PP</div>
                <div className="w-7 h-4 bg-blue-500 rounded text-white text-[8px] flex items-center justify-center font-bold">VISA</div>
                <div className="w-7 h-4 bg-orange-500 rounded text-white text-[8px] flex items-center justify-center font-bold">MC</div>
              </div>
            </div>
            <h4 className="text-[13px] font-semibold text-gray-900 mb-1">Set up a payment provider</h4>
            <p className="text-[11px] text-gray-500 mb-3">Accept payments from customers worldwide.</p>
            <button className="px-3 py-1.5 border border-[#e1e3e5] text-gray-700 text-[12px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Activate
            </button>
          </div>

          {/* Shipping */}
          <div className="bg-white p-4">
            <div className="mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e1e3e5] flex items-center justify-center text-lg">
                🇮🇳
              </div>
            </div>
            <h4 className="text-[13px] font-semibold text-gray-900 mb-1">Review your shipping rates</h4>
            <p className="text-[11px] text-gray-500 mb-3">Make sure your rates are set up correctly for India.</p>
            <button className="px-3 py-1.5 border border-[#e1e3e5] text-gray-700 text-[12px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Review
            </button>
          </div>

          {/* Domain */}
          <div className="bg-white p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-[11px] text-gray-500">qestron.myshopify.com</span>
              <button className="text-[10px] text-gray-400 hover:text-gray-600">📋</button>
            </div>
            <h4 className="text-[13px] font-semibold text-gray-900 mb-1">Customize domain</h4>
            <p className="text-[11px] text-gray-500 mb-3">Stand out with a custom domain for your store.</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-[#e1e3e5] text-gray-700 text-[12px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Customize
              </button>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Get $20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights footer */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#e1e3e5] shadow-sm">
        <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        <p className="text-[12px] text-gray-500">
          New insights and guides will appear here as you learn more about your store.
        </p>
      </div>
    </div>
  );
}
