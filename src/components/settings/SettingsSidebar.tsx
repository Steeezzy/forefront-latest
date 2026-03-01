"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    MessageCircle, Mail, Facebook, Instagram, Phone,
    UserCircle2, Bell, Clock,
    Zap, GitBranch, Users, ShieldCheck, Smile, Monitor, Tag, BarChart3, Code, ChevronRight, ChevronDown,
    CreditCard, Settings2, PenLine, Link as LinkIcon, AppWindow, Globe, Bot
} from 'lucide-react';

interface SettingsSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
    const [isLiveChatOpen, setIsLiveChatOpen] = useState(true);

    return (
        <div className="w-64 flex-shrink-0 hidden md:block pr-4 border-r border-white/5 mr-8 min-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">

            {/* CHANNELS SECTION */}
            <div className="mb-8">
                <h3 className="text-zinc-500 text-xs uppercase font-bold mb-2 px-3 tracking-wider">CHANNELS</h3>

                {/* Live Chat Dropdown */}
                <div>
                    <button
                        onClick={() => setIsLiveChatOpen(!isLiveChatOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <MessageCircle size={20} className="text-zinc-400 group-hover:text-white" />
                            <span className="text-sm font-medium">Live Chat</span>
                        </div>
                        <ChevronDown size={16} className={cn("transition-transform duration-200", isLiveChatOpen ? "rotate-180" : "")} />
                    </button>

                    {isLiveChatOpen && (
                        <div className="ml-4 mt-1 border-l border-white/10 pl-4 space-y-0.5">
                            <SidebarSubItem
                                id="Appearance"
                                label="Appearance"
                                icon={PenLine}
                                activeTab={activeTab}
                                onClick={() => onTabChange('Appearance')}
                            />
                            <SidebarSubItem
                                id="Installation"
                                label="Installation"
                                icon={LinkIcon}
                                activeTab={activeTab}
                                onClick={() => onTabChange('Installation')}
                                hasNotification={true}
                            />
                            <SidebarSubItem
                                id="Chat page"
                                label="Chat page"
                                icon={AppWindow}
                                activeTab={activeTab}
                                onClick={() => onTabChange('Chat page')}
                            />
                            <SidebarSubItem
                                id="Translations"
                                label="Translations"
                                icon={Globe}
                                activeTab={activeTab}
                                onClick={() => onTabChange('Translations')}
                            />
                        </div>
                    )}
                </div>

                <SidebarItem icon={Mail} label="Email" id="Email" activeTab={activeTab} onClick={() => onTabChange('Email')} />
                <SidebarItem icon={Facebook} label="Facebook" id="Facebook" activeTab={activeTab} onClick={() => onTabChange('Facebook')} />
                <SidebarItem icon={Instagram} label="Instagram" id="Instagram" activeTab={activeTab} onClick={() => onTabChange('Instagram')} />
                <SidebarItem icon={Phone} label="WhatsApp" id="WhatsApp" activeTab={activeTab} onClick={() => onTabChange('WhatsApp')} />
                <SidebarItem icon={Bot} label="Channel Auto-Reply" id="Channels" activeTab={activeTab} onClick={() => onTabChange('Channels')} />
            </div>

            {/* PERSONAL SECTION */}
            <div className="mb-8">
                <h3 className="text-zinc-500 text-xs uppercase font-bold mb-2 px-3 tracking-wider">PERSONAL</h3>
                <SidebarItem icon={UserCircle2} label="Account" id="Account" activeTab={activeTab} onClick={() => onTabChange('Account')} />
                <SidebarItem icon={Bell} label="Notifications" id="Notifications" activeTab={activeTab} onClick={() => onTabChange('Notifications')} />
                <SidebarItem icon={Clock} label="Operating hours" id="Operating hours" activeTab={activeTab} onClick={() => onTabChange('Operating hours')} />
            </div>

            {/* GENERAL SECTION */}
            <div className="mb-8">
                <h3 className="text-zinc-500 text-xs uppercase font-bold mb-2 px-3 tracking-wider">GENERAL</h3>
                <SidebarItem icon={Zap} label="Macros" id="Macros" activeTab={activeTab} onClick={() => onTabChange('Macros')} />
                <SidebarItem icon={GitBranch} label="Workflows" id="Workflows" activeTab={activeTab} onClick={() => onTabChange('Workflows')} />
                <SidebarItem icon={Users} label="Team" id="Team" activeTab={activeTab} onClick={() => onTabChange('Team')} />
                <SidebarItem icon={ShieldCheck} label="Service Level Agreements" id="Service Level Agreements" activeTab={activeTab} onClick={() => onTabChange('Service Level Agreements')} />
                <SidebarItem icon={Smile} label="Customer satisfaction" id="Customer satisfaction" activeTab={activeTab} onClick={() => onTabChange('Customer satisfaction')} />
                <SidebarItem icon={Monitor} label="Download apps" id="Download apps" activeTab={activeTab} onClick={() => onTabChange('Download apps')} />
                <SidebarItem icon={Tag} label="Tags and properties" id="Tags and properties" activeTab={activeTab} onClick={() => onTabChange('Tags and properties')} />
                <SidebarItem icon={BarChart3} label="Tracking" id="Tracking" activeTab={activeTab} onClick={() => onTabChange('Tracking')} />
                <button className="w-full flex items-center justify-between px-3 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                        <Code size={20} className="text-zinc-400 group-hover:text-white" />
                        <span className="text-sm font-medium">Developer</span>
                    </div>
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* PROJECT SECTION */}
            <div className="mb-8">
                <h3 className="text-zinc-500 text-xs uppercase font-bold mb-2 px-3 tracking-wider">PROJECT</h3>
                <SidebarItem icon={CreditCard} label="Billing" id="Billing" activeTab={activeTab} onClick={() => onTabChange('Billing')} />
                <SidebarItem icon={Settings2} label="Preferences" id="Preferences" activeTab={activeTab} onClick={() => onTabChange('Preferences')} />
            </div>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, id, activeTab, onClick }: { icon: any, label: string, id?: string, activeTab?: string, onClick?: () => void }) {
    const isActive = id && activeTab === id;
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative",
                isActive ? "text-blue-500 bg-blue-500/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
        >
            <Icon size={20} className={cn(isActive ? "text-blue-500" : "text-zinc-400 group-hover:text-white")} />
            <span className="text-sm font-medium">{label}</span>
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-full bg-blue-500 rounded-r-full"></div>
            )}
        </button>
    );
}

function SidebarSubItem({ id, label, icon: Icon, activeTab, onClick, hasNotification }: { id: string, label: string, icon?: any, activeTab: string, onClick: () => void, hasNotification?: boolean }) {
    const isActive = activeTab === id;

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                    ? "text-blue-500 bg-blue-500/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-2">
                {Icon && <Icon size={16} className={cn(isActive ? "text-blue-500" : "text-zinc-500")} />}
                <span>{label}</span>
            </div>
            {hasNotification && (
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-900/50"></div>
            )}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-full bg-blue-500 rounded-r-full"></div>
            )}
        </button>
    );
}
