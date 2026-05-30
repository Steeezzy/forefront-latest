import Link from 'next/link';
import { Heart, Calendar, Users, Activity, FileText, MessageSquare, Settings, ArrowLeft } from 'lucide-react';

const nav = [
  { label: 'Dashboard',      href: '/hub/care/panel' },
  { label: 'Appointments',   href: '/hub/care/panel/appointments' },
  { label: 'Patients',       href: '/hub/care/panel/patients' },
  { label: 'Consultations',  href: '/hub/care/panel/consultations' },
  { label: 'Prescriptions',  href: '/hub/care/panel/prescriptions' },
  { label: 'Reports',        href: '/hub/care/panel/reports' },
  { label: 'Messages',       href: '/hub/care/panel/messages' },
  { label: 'Settings',       href: '/hub/care/panel/settings' },
];

export default function CareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="px-4 py-4 border-b border-slate-100">
          <Link href="/hub" className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" />Hub
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-800">QestroCare</p>
              <p className="text-[10px] text-slate-400">Health Platform</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => (
            <Link key={item.label} href={item.href}
              className="flex items-center px-3 py-2 rounded-lg text-[13px] text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2 p-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">Dr</div>
            <div>
              <p className="text-[12px] font-medium text-slate-800">Dr. Karthik J</p>
              <p className="text-[10px] text-slate-400">Physician</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-3 shadow-sm">
          <div className="flex-1">
            <input type="text" placeholder="Search patients, appointments..." className="w-72 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <button className="bg-emerald-600 text-white text-[12px] font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700">New Appointment</button>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[11px] font-bold">KJ</div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
