import Link from 'next/link';
import { Code2, Terminal, GitBranch, Zap, BarChart2, Settings, BookOpen, Package, ArrowLeft } from 'lucide-react';

const nav = [
  { icon: 'LayoutDashboard', label: 'Overview',      href: '/hub/developer/panel' },
  { icon: 'Code2',           label: 'API Explorer',  href: '/hub/developer/panel/api' },
  { icon: 'Terminal',        label: 'Webhooks',      href: '/hub/developer/panel/webhooks' },
  { icon: 'GitBranch',       label: 'Integrations',  href: '/hub/developer/panel/integrations' },
  { icon: 'Package',         label: 'SDKs',          href: '/hub/developer/panel/sdks' },
  { icon: 'BarChart2',       label: 'Usage & Logs',  href: '/hub/developer/panel/logs' },
  { icon: 'BookOpen',        label: 'Docs',          href: '/hub/developer/panel/docs' },
  { icon: 'Settings',        label: 'Settings',      href: '/hub/developer/panel/settings' },
];

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      <aside className="w-[220px] flex-shrink-0 bg-[#161b22] border-r border-[#30363d] flex flex-col">
        <div className="px-4 py-4 border-b border-[#30363d]">
          <Link href="/hub" className="flex items-center gap-1 text-[11px] text-[#8b949e] hover:text-white mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" />Hub
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">Qestron Dev</p>
              <p className="text-[10px] text-[#8b949e]">Developer Platform</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(item => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors">
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#30363d]">
          <div className="bg-violet-900/30 border border-violet-700/30 rounded-lg p-3">
            <p className="text-[11px] text-violet-300 font-medium mb-1">API Key</p>
            <code className="text-[10px] text-[#8b949e] font-mono">qst_••••••••••••••••</code>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center px-4">
          <div className="flex-1 max-w-xs">
            <input type="text" placeholder="Search docs, APIs..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-[12px] text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-violet-500" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] text-[#8b949e]">v2.4.1</span>
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold">KJ</div>
          </div>
        </header>
        <main className="flex-1 bg-[#0d1117] overflow-auto">{children}</main>
      </div>
    </div>
  );
}
