"use client";

import { MessageCircle, Instagram, Facebook, Mail, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const integrations = [
    {
        title: "WhatsApp",
        description: "Integrate with WhatsApp and stay connected with your customers.",
        icon: MessageCircle,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        action: "Integrate",
        href: "/panel/settings/whatsapp"
    },
    {
        title: "Instagram",
        description: "Keep in touch with your Instagram customers.",
        icon: Instagram,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        action: "Integrate",
        href: "/panel/settings/instagram"
    },
    {
        title: "Facebook Messenger",
        description: "Do it now and start responding to queries from Messenger.",
        icon: Facebook,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        action: "Integrate",
        href: "/panel/settings/facebook"
    },
    {
        title: "Forefront widget",
        description: "Install widget and start supporting customers on your website.",
        icon: MessageSquare,
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
        action: "Install Chat Widget",
        href: "/panel/settings/widget"
    },
    {
        title: "Email",
        description: "Connect your mailbox and receive or send emails from the app.",
        icon: Mail,
        color: "text-purple-400",
        bgColor: "bg-purple-400/10",
        action: "Add email",
        href: "/panel/settings/email"
    }
];

export function IntegrationGrid() {
    return (
        <div className="mt-10">
            <p className="text-slate-400 text-sm mb-6">You can also integrate Forefront with other apps to keep everything in one place!</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((item, idx) => (
                    <Link
                        key={idx}
                        href={item.href}
                        className="group bg-[#161920] border border-white/5 rounded-xl p-5 flex flex-col items-start hover:bg-[#1c1f26] hover:border-white/10 transition-all"
                    >
                        <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center mb-3`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <h4 className="text-white font-semibold mb-1.5">{item.title}</h4>
                        <p className="text-slate-400 text-xs mb-4 leading-relaxed flex-1">{item.description}</p>
                        <span className="text-blue-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            {item.action}
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
