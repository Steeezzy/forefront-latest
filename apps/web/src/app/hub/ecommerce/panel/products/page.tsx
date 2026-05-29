'use client';

import { useState } from 'react';
import { Search, Filter, Plus, Tag, Package } from 'lucide-react';
import Image from 'next/image';

const products = [
  { id: 1, name: 'Wireless Earbuds Pro', status: 'Active', inventory: '24 in stock for 2 variants', type: 'Electronics', vendor: 'TechBrand', price: '₹1,999' },
  { id: 2, name: 'Premium Cotton T-Shirt', status: 'Active', inventory: '50 in stock for 3 variants', type: 'Apparel', vendor: 'StyleCo', price: '₹599' },
  { id: 3, name: 'Organic Face Cream', status: 'Draft', inventory: '0 in stock', type: 'Beauty', vendor: 'NatureCare', price: '₹899' },
  { id: 4, name: 'Stainless Steel Water Bottle', status: 'Active', inventory: '12 in stock', type: 'Home', vendor: 'EcoLiving', price: '₹749' },
  { id: 5, name: 'Yoga Mat Premium', status: 'Archived', inventory: '0 in stock', type: 'Sports', vendor: 'FitZone', price: '₹1,299' },
];

const tabs = ['All', 'Active', 'Draft', 'Archived'];
const colors = ['bg-red-100', 'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100'];

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => {
    const matchesTab = activeTab === 'All' || p.status === activeTab;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.filter(p => p.status === 'Active').length} active products</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-[#e1e3e5] text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Import
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#e1e3e5] px-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e1e3e5]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products"
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e1e3e5] rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <div className="ml-auto flex gap-2">
            <select className="px-3 py-1.5 border border-[#e1e3e5] rounded-lg text-[12px] text-gray-600 focus:outline-none bg-white">
              <option>Sort by: Best selling</option>
              <option>Sort by: Newest</option>
              <option>Sort by: Price (low-high)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e1e3e5]">
              <th className="w-8 px-4 py-3"><input type="checkbox" className="rounded" /></th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500" colSpan={2}>Product</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Status</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Inventory</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Type</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Vendor</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Price</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product, i) => (
              <tr key={product.id} className="border-b border-[#f3f3f3] hover:bg-[#f9f9f9] cursor-pointer transition-colors">
                <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                <td className="px-3 py-3">
                  <div className={`w-10 h-10 rounded-lg ${colors[i % colors.length]} flex items-center justify-center`}>
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <p className="text-[13px] font-medium text-blue-600 hover:underline">{product.name}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    product.status === 'Active' ? 'bg-green-100 text-green-700' :
                    product.status === 'Draft' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                      product.status === 'Active' ? 'bg-green-500' :
                      product.status === 'Draft' ? 'bg-gray-400' : 'bg-yellow-500'
                    }`} />
                    {product.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-[12px] text-gray-500">{product.inventory}</td>
                <td className="px-3 py-3 text-[12px] text-gray-500">{product.type}</td>
                <td className="px-3 py-3 text-[12px] text-gray-500">{product.vendor}</td>
                <td className="px-3 py-3 text-[13px] font-medium text-gray-900">{product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
