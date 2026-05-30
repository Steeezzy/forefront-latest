'use client';
import { Calendar, Users, Activity, Heart } from 'lucide-react';

const stats = [
  { icon: Calendar, label: 'Today\'s Appointments', value: '24', color: 'bg-blue-100 text-blue-600', trend: '+3 vs yesterday' },
  { icon: Users, label: 'Active Patients', value: '1,284', color: 'bg-emerald-100 text-emerald-600', trend: '+12 this week' },
  { icon: Activity, label: 'Consultations Done', value: '186', color: 'bg-purple-100 text-purple-600', trend: 'This month' },
  { icon: Heart, label: 'Patient Satisfaction', value: '97%', color: 'bg-rose-100 text-rose-600', trend: 'Based on 523 reviews' },
];

const appointments = [
  { time: '09:00 AM', name: 'Priya Sharma', type: 'General Checkup', status: 'Confirmed', avatar: 'PS' },
  { time: '09:30 AM', name: 'Rahul Mehta', type: 'Follow-up', status: 'Checked In', avatar: 'RM' },
  { time: '10:00 AM', name: 'Anjali Kumar', type: 'Consultation', status: 'Waiting', avatar: 'AK' },
  { time: '10:30 AM', name: 'Suresh Nair', type: 'Lab Review', status: 'Confirmed', avatar: 'SN' },
  { time: '11:00 AM', name: 'Meena Patel', type: 'Vaccination', status: 'Scheduled', avatar: 'MP' },
];

const statusColors: Record<string,string> = {
  'Confirmed': 'bg-blue-100 text-blue-700',
  'Checked In': 'bg-green-100 text-green-700',
  'Waiting': 'bg-amber-100 text-amber-700',
  'Scheduled': 'bg-slate-100 text-slate-700',
};

export default function CarePanelHome() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Good morning, Dr. Karthik 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">You have 24 appointments today</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-medium text-slate-700">Wednesday, 29 May 2026</p>
          <p className="text-[11px] text-slate-400">QestroCare · Kochi Clinic</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-[11px] font-medium text-slate-600 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-slate-400 mt-1">{s.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-slate-800">Today&apos;s Appointments</h2>
          <button className="text-[12px] text-emerald-600 font-medium hover:text-emerald-700">View all →</button>
        </div>
        <table className="w-full">
          <thead><tr className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wide">
            <th className="text-left px-5 py-2.5">Time</th>
            <th className="text-left px-5 py-2.5">Patient</th>
            <th className="text-left px-5 py-2.5">Type</th>
            <th className="text-left px-5 py-2.5">Status</th>
            <th className="text-left px-5 py-2.5">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map(a => (
              <tr key={a.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-[12px] font-mono text-slate-600">{a.time}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">{a.avatar}</div>
                    <span className="text-[13px] font-medium text-slate-800">{a.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-[12px] text-slate-600">{a.type}</td>
                <td className="px-5 py-3"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>{a.status}</span></td>
                <td className="px-5 py-3">
                  <button className="text-[12px] text-emerald-600 font-medium hover:text-emerald-700">Start →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
