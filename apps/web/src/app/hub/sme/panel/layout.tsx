import Link from 'next/link';
import { Briefcase, MessageSquare, Users, TrendingUp, FileText, Package, Settings, ArrowLeft } from 'lucide-react';

const nav = [
  { label: 'Overview',     href: '/hub/sme/panel' },
  { label: 'Customers',    href: '/hub/sme/panel/customers' },
  { label: 'Products',     href: '/hub/sme/panel/products' },
  { label: 'Invoices',     href: '/hub/sme/panel/invoices' },
  { label: 'WhatsApp',     href: '/hub/sme/panel/whatsapp' },
  { label: 'Reports',      href: '/hub/sme/panel/reports' },
  { label: 'Settings',     href: '/hub/sme/panel/settings' },
];

export default function SMELayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex">
      <aside className="w-[220px] flex-shrink-0 bg-[#1f2c34] border-r border-[#2a3942] flex flex-col">
        <div className="px-4 py-5 border-b border-[#2a3942]">
          <Link href="/hub" className="flex items-center gap-1 text-[11px] text-[#8696a0] hover:text-white mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" />Hub
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center shadow">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">QestroSME</p>
              <p className="text-[10px] text-[#8696a0]">Business Platform</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {nav.map(item => (
            <Link key={item.label} href={item.href}
              className="flex items-center px-3 py-2.5 rounded-lg text-[13px] text-[#8696a0] hover:bg-[#2a3942] hover:text-white transition-colors font-medium">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#2a3942]">
          <div className="flex items-center gap-2 p-2">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold">KJ</div>
            <div>
              <p className="text-[12px] font-medium text-white">Karthik J</p>
              <p className="text-[10px] text-[#8696a0]">Owner</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-[#1f2c34] border-b border-[#2a3942] flex items-center px-5 gap-3">
          <div className="flex-1">
            <input type="text" placeholder="Search customers, invoices..." className="w-72 bg-[#2a3942] border border-[#3d5b69] rounded-lg px-3 py-1.5 text-[12px] text-white placeholder-[#8696a0] focus:outline-none focus:border-amber-400" />
          </div>
          <button className="bg-amber-500 text-white text-[12px] font-semibold px-4 py-2 rounded-lg hover:bg-amber-600">+ New Invoice</button>
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[11px] font-bold">KJ</div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
