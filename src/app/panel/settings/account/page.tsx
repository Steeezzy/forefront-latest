"use client";

import { useState } from 'react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Button } from '@/components/ui/button';
import { MessageSquare, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AccountSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Personal details' | 'Custom signature' | 'Password'>('Personal details');

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
                </div>

                {/* FAB */}
                <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center justify-center p-0 z-50">
                    <MessageSquare className="text-white" size={24} />
                </Button>
            </div>
        </div>
    );
}
