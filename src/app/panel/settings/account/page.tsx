"use client";

import { useState } from 'react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Type, Bold, Italic, Link as LinkIcon, List, AlignLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AccountSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Personal details' | 'Custom signature' | 'Password'>('Personal details');
    const [signatureEnabled, setSignatureEnabled] = useState(false);
    const [signatureText, setSignatureText] = useState('Best regards,\nKarthik J\nForefront Support');
    const [signatureApplyTo, setSignatureApplyTo] = useState<'all' | 'email'>('email');

    const handleSidebarNav = (tab: string) => {
        if (tab === 'Account') return;
        if (['Email', 'Facebook', 'Instagram', 'WhatsApp'].includes(tab)) {
            router.push(`/panel/settings/${tab.toLowerCase().replace(' ', '-')}`);
        } else {
            router.push('/panel/settings');
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="Account" onTabChange={handleSidebarNav} />
            </div>

            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                <div className="max-w-[800px]">
                    <h1 className="text-2xl font-bold text-white mb-2">Account</h1>
                    <p className="text-zinc-400 mb-8 max-w-2xl text-sm">
                        Change your agent name, add your profile picture, change your email address, select your region and language.
                    </p>

                    {/* Tabs */}
                    <div className="flex items-center gap-8 border-b border-white/5 mb-8">
                        {['Personal details', 'Custom signature', 'Password'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "pb-4 text-sm font-medium transition-colors border-b-2",
                                    activeTab === tab
                                        ? "text-blue-500 border-blue-500"
                                        : "text-zinc-500 border-transparent hover:text-zinc-300"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    {activeTab === 'Personal details' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Name</label>
                                <input
                                    type="text"
                                    defaultValue="Karthik J"
                                    className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none placeholder-zinc-600"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Your picture</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/5">
                                        <User size={32} className="text-zinc-500" />
                                    </div>
                                    <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800">
                                        Upload picture
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Email</label>
                                <input
                                    type="email"
                                    defaultValue="karthikj@gmail.com"
                                    disabled
                                    className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-4 py-3 text-white/50 cursor-not-allowed focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-2">Region</label>
                                    <select className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer" defaultValue="">
                                        <option value="" disabled>Select...</option>
                                        <option value="us">United States</option>
                                        <option value="eu">Europe</option>
                                        <option value="asia">Asia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-2">Language</label>
                                    <select className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer" defaultValue="en">
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg">
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Custom Signature Tab */}
                    {activeTab === 'Custom signature' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Enable toggle */}
                            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <div>
                                    <h3 className="text-white text-sm font-medium">Enable email signature</h3>
                                    <p className="text-zinc-500 text-xs mt-0.5">Your signature will be appended to every outgoing email reply.</p>
                                </div>
                                <button
                                    onClick={() => setSignatureEnabled(!signatureEnabled)}
                                    className={cn(
                                        "relative w-11 h-6 rounded-full transition-colors",
                                        signatureEnabled ? "bg-blue-600" : "bg-zinc-700"
                                    )}
                                >
                                    <span className={cn(
                                        "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow",
                                        signatureEnabled ? "translate-x-5" : "translate-x-0.5"
                                    )} />
                                </button>
                            </div>

                            {/* Apply to selector */}
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Apply signature to</label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'email', label: 'Email replies only' },
                                        { value: 'all', label: 'All channels' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setSignatureApplyTo(opt.value as any)}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-sm border transition-colors",
                                                signatureApplyTo === opt.value
                                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Signature editor */}
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Signature content</label>
                                {/* Mini toolbar */}
                                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-t-lg px-2 py-1.5 border-b-0">
                                    <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors" title="Bold">
                                        <Bold size={14} />
                                    </button>
                                    <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors" title="Italic">
                                        <Italic size={14} />
                                    </button>
                                    <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors" title="Insert Link">
                                        <LinkIcon size={14} />
                                    </button>
                                    <div className="w-px h-4 bg-zinc-800 mx-1" />
                                    <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors" title="List">
                                        <List size={14} />
                                    </button>
                                    <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors" title="Align">
                                        <AlignLeft size={14} />
                                    </button>
                                </div>
                                <textarea
                                    value={signatureText}
                                    onChange={(e) => setSignatureText(e.target.value)}
                                    rows={5}
                                    className="w-full bg-[#0f1115] border border-zinc-800 rounded-b-lg px-4 py-3 text-white text-sm focus:border-blue-500 focus:outline-none placeholder-zinc-600 resize-none font-sans"
                                    placeholder="Enter your email signature..."
                                />
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Preview</label>
                                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                    <div className="border-t border-zinc-700 pt-3 mt-1">
                                        <p className="text-zinc-400 text-sm whitespace-pre-wrap leading-relaxed">{signatureText || 'Your signature will appear here...'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg">
                                    Save signature
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* FAB */}
                <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center justify-center p-0 z-50">
                    <MessageSquare className="text-white" size={24} />
                </Button>
            </div>
        </div>
    );
}
