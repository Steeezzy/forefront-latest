"use client";

import { MessageSquare, Ticket, Bot, GitBranch, Users } from 'lucide-react';

const actions = [
    {
        title: "Live conversations",
        subtitle: "0 unassigned",
        icon: MessageSquare,
        color: "text-blue-500",
        href: "#"
    },
    {
        title: "Tickets",
        subtitle: "0 unassigned",
        icon: Ticket,
        color: "text-purple-500",
        href: "#"
    },
    {
        title: "Questron Agent",
        subtitle: "0 unanswered questions",
        icon: Bot,
        color: "text-emerald-500",
        href: "#"
    },
    {
        title: "Flows",
        subtitle: "1 active Flow",
        icon: GitBranch,
        color: "text-orange-500",
        href: "#"
    }
];

export function QuickActions() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {actions.map((action, idx) => (
                <div
                    key={idx}
                    className="bg-[#ffffff] border border-[#e4e4e7] rounded-[10px] p-[16px_20px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-[#fafafa] transition-all duration-200 cursor-pointer group"
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg bg-gray-50 flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                            <action.icon size={20} />
                        </div>
                        <div>
                            <h4 className="text-[#09090b] text-[13px] font-semibold mb-1">{action.title}</h4>
                            <p className="text-[#52525b] text-[13px]">{action.subtitle}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
