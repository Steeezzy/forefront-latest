'use client';

import { useState } from 'react';
import { ChevronRight, MapPin, User } from 'lucide-react';

export default function SettingsGeneralPage() {
  const [storeName, setStoreName] = useState('My Store');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [prefix, setPrefix] = useState('#');
  const [suffix, setSuffix] = useState('');

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
      <h1 className="text-[22px] font-semibold text-gray-900 flex items-center gap-2">
        ⚙️ General
      </h1>

      {/* Store contact details */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e1e3e5]">
          <h2 className="text-[14px] font-semibold text-gray-900">Store contact details</h2>
        </div>
        <div className="divide-y divide-[#f3f3f3]">
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f9f9f9] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-medium text-gray-900">My Store</p>
                <p className="text-[11px] text-gray-500">karthiknedumalayil@gmail.com · No phone number</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f9f9f9] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-medium text-gray-900">Store address</p>
                <p className="text-[11px] text-gray-500">India</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Store defaults */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e1e3e5]">
          <h2 className="text-[14px] font-semibold text-gray-900">Store defaults</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Currency */}
          <div className="flex items-center justify-between py-3 border-b border-[#f3f3f3]">
            <div>
              <p className="text-[13px] font-medium text-gray-900">Currency display</p>
              <p className="text-[11px] text-gray-500 mt-0.5">To manage the currencies customers see, go to Markets</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-600 font-medium">Indian Rupee (INR ₹)</span>
              <button className="text-gray-400 hover:text-gray-600">···</button>
            </div>
          </div>

          {/* Backup Region */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-gray-700">Backup Region</label>
            <select
              className="w-full px-3 py-2 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
              defaultValue="India"
            >
              <option>India</option>
              <option>United States</option>
              <option>United Kingdom</option>
            </select>
            <p className="text-[11px] text-gray-400">Determines settings for customers outside of your markets</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Unit system */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-700">Unit system</label>
              <select className="w-full px-3 py-2 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white">
                <option>Metric system</option>
                <option>Imperial system</option>
              </select>
            </div>
            {/* Default weight unit */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-700">Default weight unit</label>
              <select className="w-full px-3 py-2 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white">
                <option>Kilogram (kg)</option>
                <option>Gram (g)</option>
                <option>Pound (lb)</option>
              </select>
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-gray-700">Time zone</label>
            <select className="w-full px-3 py-2 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white">
              <option>(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
              <option>(GMT+00:00) UTC</option>
              <option>(GMT-05:00) Eastern Time</option>
            </select>
            <p className="text-[11px] text-gray-400">Sets the time for when orders and analytics are recorded</p>
          </div>
        </div>
      </div>

      {/* Order ID format */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e1e3e5]">
          <h2 className="text-[14px] font-semibold text-gray-900">Order ID format</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">Shown on the order page, customer pages, and customer order notifications to identify orders</p>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-700">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-700">Suffix</label>
              <input
                type="text"
                value={suffix}
                onChange={e => setSuffix(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500">Your order ID will appear as {prefix}1001, {prefix}1002, {prefix}1003{suffix} ...</p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 transition-colors">
          Save
        </button>
      </div>
    </div>
  );
}
