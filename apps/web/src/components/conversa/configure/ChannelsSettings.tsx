"use client";

import { Switch } from '@/components/ui/switch';
import { MessageSquare, Facebook, Instagram, Phone, Mail } from 'lucide-react';

export function ChannelsSettings() {
    return (
        <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 mb-6">
            <div className="mb-6">
                <h3 className="text-gray-900 font-semibold mb-1">Channels</h3>
                <p className="text-slate-400 text-sm">Select the channels on which Conversa should be visible to your customers. Conversa is available by default in the Live chat.</p>
            </div>


            <div className="space-y-6">
                <h4 className="text-gray-900 text-sm font-medium">Live conversations</h4>

                {/* Live Chat */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare size={18} className="text-slate-400" />
                        <span className="text-gray-900 text-sm">Live chat</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
                        <a href="#" className="text-blue-500 text-sm hover:underline w-32 text-right">Install Chat Widget</a>
                    </div>
                </div>

                {/* Messenger */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Facebook size={18} className="text-slate-400" />
                        <span className="text-gray-900 text-sm">Messenger</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Switch disabled className="data-[state=checked]:bg-blue-600" />
                        <a href="#" className="text-blue-500 text-sm hover:underline w-32 text-right">Integrate</a>
                    </div>
                </div>

                {/* Instagram */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Instagram size={18} className="text-slate-400" />
                        <span className="text-gray-900 text-sm">Instagram</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Switch disabled className="data-[state=checked]:bg-blue-600" />
                        <a href="#" className="text-blue-500 text-sm hover:underline w-32 text-right">Integrate</a>
                    </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Phone size={18} className="text-slate-400" />
                        <span className="text-gray-900 text-sm">WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Switch disabled className="data-[state=checked]:bg-blue-600" />
                        <a href="#" className="text-blue-500 text-sm hover:underline w-32 text-right">Integrate</a>
                    </div>
                </div>

                <h4 className="text-gray-900 text-sm font-medium pt-4">Tickets <span className="bg-white/10 text-gray-900 text-[10px] px-1.5 py-0.5 rounded ml-2">BETA</span></h4>

                {/* Email */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Mail size={18} className="text-slate-400" />
                        <span className="text-gray-900 text-sm">Email</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Switch disabled className="data-[state=checked]:bg-blue-600" />
                        <a href="#" className="text-blue-500 text-sm hover:underline w-32 text-right">Connect mailbox</a>
                    </div>
                </div>

            </div>
        </div>
    );
}
