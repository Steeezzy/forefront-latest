"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function TranslationsView() {
    const [language, setLanguage] = useState('English');
    const [translations, setTranslations] = useState({
        name: 'Karthik J',
        online: "We're online",
        offline: "We're offline",
        chat: 'CHAT',
        intro: 'Please introduce yourself:',
        chatWithUs: 'Chat with us',
        yourName: 'Enter your name...',
        yourEmail: 'Enter your email...',
        yourPhone: 'Enter your phone...',
        yourMessage: 'Enter your message...',
        gdpr: ''
    });

    const handleChange = (key: keyof typeof translations, value: string) => {
        setTranslations(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="space-y-4">
                <p className="text-zinc-400 text-sm">
                    Enable as many languages as you want, and add the ones you need. The widget will match your users default browser language. To add a new translation select from the dropdown.
                </p>

                <div className="flex gap-4">
                    <div className="relative w-64">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full bg-[#ffffff] border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 appearance-none cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                            <option>Select...</option>
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-3 text-zinc-400 pointer-events-none" size={16} />
                    </div>
                    <button className="px-4 py-2 bg-white/5 text-zinc-400 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-gray-900 transition-colors">
                        Add
                    </button>
                </div>
            </div>

            <div className="bg-[#ffffff] border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button className="px-6 py-4 text-sm font-medium text-blue-500 border-b-2 border-blue-500">
                        English
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-[200px,1fr] gap-x-8 gap-y-6 items-center mb-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        <div>Phrase</div>
                        <div>Translation</div>
                    </div>

                    <div className="space-y-6">
                        <TranslationRow label="Name:" value={translations.name} onChange={(v) => handleChange('name', v)} />
                        <TranslationRow label="We're online" value={translations.online} onChange={(v) => handleChange('online', v)} />
                        <TranslationRow label="We're offline" value={translations.offline} onChange={(v) => handleChange('offline', v)} />
                        <TranslationRow label="CHAT" value={translations.chat} onChange={(v) => handleChange('chat', v)} />
                        <TranslationRow label="Please introduce yourself:" value={translations.intro} onChange={(v) => handleChange('intro', v)} />
                        <TranslationRow label="Chat with us" value={translations.chatWithUs} onChange={(v) => handleChange('chatWithUs', v)} />
                        <TranslationRow label="Enter your name..." value={translations.yourName} onChange={(v) => handleChange('yourName', v)} />
                        <TranslationRow label="Enter your email..." value={translations.yourEmail} onChange={(v) => handleChange('yourEmail', v)} />
                        <TranslationRow label="Enter your phone..." value={translations.yourPhone} onChange={(v) => handleChange('yourPhone', v)} />
                        <TranslationRow label="Enter your message..." value={translations.yourMessage} onChange={(v) => handleChange('yourMessage', v)} />
                        <TranslationRow label="Gdpr consent" value={translations.gdpr} onChange={(v) => handleChange('gdpr', v)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TranslationRow({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="grid grid-cols-[200px,1fr] gap-8 items-center">
            <label className="text-zinc-400 text-sm font-medium">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                placeholder={label.replace(':', '')}
            />
        </div>
    );
}
