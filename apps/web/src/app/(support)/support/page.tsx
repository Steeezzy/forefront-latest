'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Smile,
  TicketCheck,
  UserCheck,
  MessageSquarePlus,
  Building2,
} from 'lucide-react';

const mockStats = {
  openTickets: 23,
  resolvedToday: 47,
  avgResponseMins: 8,
  csatScore: 94,
};

const urgentTickets = [
  { id: 'TK-1047', customer: 'Raj Kumar', title: 'Unable to connect WhatsApp channel', priority: 'urgent', timeOpen: '5 min ago' },
  { id: 'TK-1043', customer: 'Divya Retail', title: 'Bot not responding after update', priority: 'urgent', timeOpen: '12 min ago' },
  { id: 'TK-1039', customer: 'MedCare Hospitals', title: 'Voice agent dropping calls mid-conversation', priority: 'urgent', timeOpen: '34 min ago' },
  { id: 'TK-1031', customer: 'TechZone India', title: 'Billing charge discrepancy — double charged', priority: 'high', timeOpen: '1 hr ago' },
  { id: 'TK-1028', customer: 'Priya Hospitals', title: 'Razorpay payment not reflecting in portal', priority: 'high', timeOpen: '2 hr ago' },
];

const teamActivity = [
  { type: 'resolved', icon: CheckCircle, color: 'text-emerald-500', message: 'Sneha R resolved TK-1044 — "Dashboard not loading"', time: '3 min ago' },
  { type: 'assigned', icon: UserCheck, color: 'text-blue-500', message: 'Arjun K assigned TK-1047 to himself', time: '7 min ago' },
  { type: 'comment', icon: MessageSquarePlus, color: 'text-indigo-500', message: 'Deepa M added internal note on TK-1039', time: '15 min ago' },
  { type: 'onboarded', icon: Building2, color: 'text-violet-500', message: 'New workspace "SunTech Pvt Ltd" onboarded', time: '22 min ago' },
  { type: 'resolved', icon: CheckCircle, color: 'text-emerald-500', message: 'Rahul S resolved TK-1036 — "WhatsApp template rejected"', time: '41 min ago' },
  { type: 'assigned', icon: UserCheck, color: 'text-blue-500', message: 'Meena V assigned TK-1031 to billing team', time: '58 min ago' },
  { type: 'comment', icon: MessageSquarePlus, color: 'text-indigo-500', message: 'Arjun K replied to TK-1028 with payment steps', time: '1 hr ago' },
];

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

export default function SupportDashboard() {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const urgentCount = urgentTickets.filter((t) => t.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-medium text-gray-700">Support Agent</span> · {today}
          </p>
        </div>
      </div>

      {/* Urgent alert banner */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700">
            {urgentCount} ticket{urgentCount !== 1 ? 's' : ''} need immediate attention
          </p>
          <a href="/support/tickets" className="ml-auto text-xs font-semibold text-red-600 hover:underline">
            View all →
          </a>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Tickets"
          value={mockStats.openTickets}
          icon={<TicketCheck className="w-5 h-5 text-blue-500" />}
          bg="bg-blue-50"
          valueColor="text-blue-700"
        />
        <StatCard
          label="Resolved Today"
          value={mockStats.resolvedToday}
          icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
          bg="bg-emerald-50"
          valueColor="text-emerald-700"
        />
        <StatCard
          label="Avg Response Time"
          value={`${mockStats.avgResponseMins} mins`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          bg="bg-amber-50"
          valueColor="text-amber-700"
        />
        <StatCard
          label="CSAT Score"
          value={`${mockStats.csatScore}%`}
          icon={<Smile className="w-5 h-5 text-violet-500" />}
          bg="bg-violet-50"
          valueColor="text-violet-700"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tickets */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Urgent Tickets
            </h2>
            <a href="/support/tickets" className="text-xs text-indigo-600 hover:underline font-medium">
              View queue →
            </a>
          </div>
          <ul className="divide-y divide-gray-50">
            {urgentTickets.map((ticket) => (
              <li key={ticket.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[ticket.priority]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">{ticket.id}</span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_BADGE[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{ticket.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ticket.customer} · <span className="text-gray-400">{ticket.timeOpen}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Team Activity */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Team Activity</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {teamActivity.map((event, i) => {
              const Icon = event.icon;
              return (
                <li key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{event.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{event.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  bg,
  valueColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
  valueColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
