"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { EmailHero } from '@/components/settings/email/EmailHero';
import { EmailTable } from '@/components/settings/email/EmailTable';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmailSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Mailbox' | 'Sender address' | 'Domains' | 'Blocked'>('Mailbox');

    // Mailbox Data
    const mailboxes: Array<{ email: string; status: string }> = [];

    // Sender Data
    const senderAddresses: Array<{ address: string; type: string; status: string }> = [];

    // Domains Data
    const domains: Array<{ domain: string; status: string; usage: string }> = [];

    // Blocked Data
    const blockedEmails: Array<{ email: string; date: string }> = [];

    const handleSidebarNav = (tab: string) => {
        if (tab === 'Email') return;
        if (['Facebook', 'Instagram', 'WhatsApp', 'Account'].includes(tab)) {
            router.push(`/panel/settings/${tab.toLowerCase().replace(' ', '-')}`);
        } else {
            router.push('/panel/settings');
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            {/* Sidebar (Reusing SettingsSidebar with 'Email' active) */}
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="Email" onTabChange={handleSidebarNav} />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                <div className="max-w-[1000px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-6">Email</h1>

                            {/* Tabs */}
                            <div className="flex items-center gap-8 border-b border-white/5">
                                {[
                                    { id: 'Mailbox', label: 'Mailbox' },
                                    { id: 'Sender address', label: 'Sender address' },
                                    { id: 'Domains', label: 'Domains' },
                                    { id: 'Blocked', label: 'Blocked e-mail addresses' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "pb-4 text-sm font-medium transition-colors border-b-2",
                                            activeTab === tab.id
                                                ? "text-blue-500 border-blue-500"
                                                : "text-zinc-500 border-transparent hover:text-zinc-300"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-auto">
                            <a href="#" className="flex items-center gap-2 text-zinc-400 text-sm hover:text-blue-400 transition-colors">
                                Forwarding emails to Tidio <ExternalLink size={14} />
                            </a>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2">
                                Connect mailbox
                            </Button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* MAILBOX TAB */}
                        {activeTab === 'Mailbox' && (
                            <>
                                <EmailHero
                                    title="Start managing your support emails in 3 steps"
                                    steps={['Connect your mailbox', 'Add a domain', 'Set sender address']}
                                    buttonText="Connect mailbox"
                                    illustrationType="mailbox"
                                />

                                <div className="mb-4">
                                    <p className="text-zinc-400 text-sm">Automatically forward emails from other providers directly to the Tidio Inbox, to see and reply to them alongside your chats and messenger conversations.</p>
                                </div>

                                <EmailTable
                                    headers={['Email', 'Status']}
                                    data={mailboxes}
                                    emptyStateMessage="Connect mailbox to start forwarding all your incoming emails to Tidio"
                                />

                                <div className="mt-8">
                                    <a href="#" className="text-blue-500 text-sm hover:underline">Missing anything in Email? Give feedback</a>
                                </div>
                            </>
                        )}

                        {/* SENDER ADDRESS TAB */}
                        {activeTab === 'Sender address' && (
                            <>
                                <div className="mb-6">
                                    <p className="text-zinc-400 text-sm mb-4">Keep sending tickets from Tidio domain or start using your own domain to improve your credibility and increase the deliverability.</p>

                                    <div className="flex items-center gap-4">
                                        <span className="text-zinc-400 text-sm">Default</span>
                                        <div className="relative">
                                            <select className="appearance-none bg-[#0f1115] border border-zinc-800 rounded-md py-2 pl-4 pr-10 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer">
                                                <option>Tidio domain</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <EmailTable
                                    headers={['Sender address', 'Sender type', 'Status']}
                                    data={senderAddresses}
                                    emptyStateMessage="You don't have any connected domains yet, to add a new sender address. Connect your domain"
                                    emptyStateAction={
                                        <button className="text-blue-500 text-sm font-medium hover:underline mt-1">Connect your domain</button>
                                    }
                                />
                            </>
                        )}

                        {/* DOMAINS TAB */}
                        {activeTab === 'Domains' && (
                            <>
                                <EmailHero
                                    title="Start managing your support emails in 3 steps"
                                    steps={['Connect your mailbox', 'Add a domain', 'Set sender address']}
                                    buttonText="Add domain"
                                    illustrationType="domains"
                                />

                                <div className="mb-4">
                                    <p className="text-zinc-400 text-sm">Sending emails from your domain can help improve delivery rates, and make your emails look more professional. Verify your domain and remove "via tidio.com" from your emails.</p>
                                </div>

                                <EmailTable
                                    headers={['Domain', 'Status', 'Usage']}
                                    data={domains}
                                    emptyStateMessage="You haven't added any domain yet."
                                />
                            </>
                        )}

                        {/* BLOCKED TAB */}
                        {activeTab === 'Blocked' && (
                            <>
                                <div className="flex justify-end mb-4">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Block another e-mail address
                                    </Button>
                                </div>

                                <div className="mb-4">
                                    <p className="text-zinc-400 text-sm">List of blocked e-mail addresses from which you won't receive any tickets.</p>
                                </div>

                                <EmailTable
                                    headers={['Email', 'Last update']}
                                    data={blockedEmails}
                                    emptyStateMessage="No filtered emails"
                                />
                            </>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
