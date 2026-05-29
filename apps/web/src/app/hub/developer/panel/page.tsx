'use client';
import { Code2, Zap, GitBranch, BarChart2, Terminal, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const quickLinks = [
  { icon: Code2, label: 'REST API Reference', desc: 'Full API documentation with examples', color: 'text-blue-400', href: '#' },
  { icon: Terminal, label: 'Webhooks', desc: 'Real-time event notifications', color: 'text-green-400', href: '/hub/developer/panel/webhooks' },
  { icon: GitBranch, label: 'Integrations', desc: 'Connect third-party services', color: 'text-purple-400', href: '#' },
  { icon: Zap, label: 'Quick Start', desc: 'Get your first API call working in 5 min', color: 'text-yellow-400', href: '#' },
];

const metrics = [
  { label: 'API Calls (today)', value: '12,847' },
  { label: 'Success rate', value: '99.8%' },
  { label: 'Avg latency', value: '142ms' },
  { label: 'Webhooks sent', value: '384' },
];

export default function DevPanelHome() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Developer Overview</h1>
        <p className="text-[#8b949e] text-sm">Qestron API Platform · v2.4.1</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <p className="text-[11px] text-[#8b949e] mb-1">{m.label}</p>
            <p className="text-xl font-bold text-white">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {quickLinks.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#8b949e] cursor-pointer transition-colors group">
              <Icon className={`w-6 h-6 ${item.color} mb-3`} />
              <h3 className="text-[14px] font-semibold text-white mb-1">{item.label}</h3>
              <p className="text-[12px] text-[#8b949e]">{item.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-[12px] text-[#8b949e] group-hover:text-white transition-colors">
                Explore <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <h2 className="text-[14px] font-semibold text-white mb-3">Quick API test</h2>
        <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-[12px]">
          <span className="text-[#8b949e]">$ </span>
          <span className="text-green-400">curl</span>
          <span className="text-white"> -H </span>
          <span className="text-yellow-300">&apos;Authorization: Bearer qst_••••••••&apos;</span>
          <span className="text-white"> \<br/>  https://api.qestron.com/v1/agents</span>
        </div>
      </div>
    </div>
  );
}
