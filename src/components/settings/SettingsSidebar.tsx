"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    MessageCircle, Mail, Facebook, Instagram, Phone,
    UserCircle2, Bell, Clock,
    Zap, GitBranch, Users, ShieldCheck, Smile, Monitor, Tag, BarChart3, Code, ChevronRight, ChevronDown,
    CreditCard, Settings2, PenLine, Link as LinkIcon, AppWindow, Globe, Bot, ShoppingBag
} from 'lucide-react';

interface SettingsSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
    const [isLiveChatOpen, setIsLiveChatOpen] = useState(true);

    const sidebarStyle: React.CSSProperties = {
        width: '220px',
        background: '#ffffff',
        borderRight: '1px solid #e4e4e7',
        minHeight: '100vh',
        padding: '16px 12px',
        flexShrink: 0,
    };

    const sectionLabelStyle: React.CSSProperties = {
        fontSize: '10px',
        fontWeight: 600,
        color: '#a1a1aa',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '0 8px',
        marginBottom: '6px',
        marginTop: '16px',
    };

    return (
        <div style={sidebarStyle} className="overflow-y-auto custom-scrollbar">

            {/* CHANNELS SECTION */}
            <div style={{ marginBottom: '6px' }}>
                <div style={sectionLabelStyle}>CHANNELS</div>

                {/* Live Chat Dropdown */}
                <div>
                    <button
                        onClick={() => setIsLiveChatOpen(!isLiveChatOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            gap: '8px',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#52525b',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageCircle size={15} color="#71717a" />
                            <span>Live Chat</span>
                        </div>
                        <ChevronDown size={14} className={cn("transition-transform duration-200", isLiveChatOpen ? "rotate-180" : "")} />
                    </button>

                    {isLiveChatOpen && (
                        <div style={{ marginLeft: '12px', marginTop: '1px', borderLeft: '1px solid #e4e4e7', paddingLeft: '12px' }}>
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
                <SidebarItem icon={ShoppingBag} label="Shopify" id="Shopify" activeTab={activeTab} onClick={() => onTabChange('Shopify')} />
            </div>

            {/* PERSONAL SECTION */}
            <div style={{ marginBottom: '6px' }}>
                <div style={sectionLabelStyle}>PERSONAL</div>
                <SidebarItem icon={UserCircle2} label="Account" id="Account" activeTab={activeTab} onClick={() => onTabChange('Account')} />
                <SidebarItem icon={Bell} label="Notifications" id="Notifications" activeTab={activeTab} onClick={() => onTabChange('Notifications')} />
                <SidebarItem icon={Clock} label="Operating hours" id="Operating hours" activeTab={activeTab} onClick={() => onTabChange('Operating hours')} />
            </div>

            {/* GENERAL SECTION */}
            <div style={{ marginBottom: '6px' }}>
                <div style={sectionLabelStyle}>GENERAL</div>
                <SidebarItem icon={Zap} label="Macros" id="Macros" activeTab={activeTab} onClick={() => onTabChange('Macros')} />
                <SidebarItem icon={GitBranch} label="Workflows" id="Workflows" activeTab={activeTab} onClick={() => onTabChange('Workflows')} />
                <SidebarItem icon={Users} label="Team" id="Team" activeTab={activeTab} onClick={() => onTabChange('Team')} />
                <SidebarItem icon={ShieldCheck} label="Service Level Agreements" id="Service Level Agreements" activeTab={activeTab} onClick={() => onTabChange('Service Level Agreements')} />
                <SidebarItem icon={Smile} label="Customer satisfaction" id="Customer satisfaction" activeTab={activeTab} onClick={() => onTabChange('Customer satisfaction')} />
                <SidebarItem icon={Monitor} label="Download apps" id="Download apps" activeTab={activeTab} onClick={() => onTabChange('Download apps')} />
                <SidebarItem icon={Tag} label="Tags and properties" id="Tags and properties" activeTab={activeTab} onClick={() => onTabChange('Tags and properties')} />
                <SidebarItem icon={BarChart3} label="Tracking" id="Tracking" activeTab={activeTab} onClick={() => onTabChange('Tracking')} />
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#52525b',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Code size={15} color="#71717a" />
                        <span>Developer</span>
                    </div>
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* PROJECT SECTION */}
            <div>
                <div style={sectionLabelStyle}>PROJECT</div>
                <SidebarItem icon={CreditCard} label="Billing" id="Billing" activeTab={activeTab} onClick={() => onTabChange('Billing')} />
                <SidebarItem icon={Settings2} label="Preferences" id="Preferences" activeTab={activeTab} onClick={() => onTabChange('Preferences')} />
            </div>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, id, activeTab, onClick }: { icon: any, label: string, id?: string, activeTab?: string, onClick?: () => void }) {
    const isActive = id && activeTab === id;
    
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                color: isActive ? '#09090b' : '#52525b',
                background: isActive ? '#f4f4f5' : 'transparent',
                cursor: 'pointer',
                fontWeight: isActive ? 500 : 400,
            }}
        >
            <Icon size={15} color={isActive ? '#09090b' : '#71717a'} />
            <span>{label}</span>
        </div>
    );
}

function SidebarSubItem({ id, label, icon: Icon, activeTab, onClick, hasNotification }: { id: string, label: string, icon?: any, activeTab: string, onClick: () => void, hasNotification?: boolean }) {
    const isActive = activeTab === id;

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                color: isActive ? '#09090b' : '#52525b',
                background: isActive ? '#f4f4f5' : 'transparent',
                cursor: 'pointer',
                fontWeight: isActive ? 500 : 400,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Icon && <Icon size={15} color={isActive ? '#09090b' : '#71717a'} />}
                <span>{label}</span>
            </div>
            {hasNotification && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', marginLeft: '4px' }}></div>
            )}
        </div>
    );
}
