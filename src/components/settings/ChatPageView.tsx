"use client";

import { useState } from 'react';
import { ChevronDown, Info, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ChatPageView() {
    const [openSection, setOpenSection] = useState<string | null>('Appearance');
    const [bgColor, setBgColor] = useState('#eff2f6'); // Light gray default as per screenshot
    const [companyUrl, setCompanyUrl] = useState('testforefront.myshopify.com');
    const [header, setHeader] = useState('Welcome to testforefront.myshopify.com');
    const [welcomeMsg, setWelcomeMsg] = useState('Ask us anything 🎉');

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Left Column: Form */}
            <div className="flex-1 overflow-y-auto pr-4 space-y-4">

                {/* Appearance */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('Appearance')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <span className="font-semibold text-white">Appearance</span>
                        <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", openSection === 'Appearance' && "rotate-180")} />
                    </button>

                    {openSection === 'Appearance' && (
                        <div className="p-4 border-t border-white/5 space-y-6">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Background color</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center bg-white">
                                        <div className="w-6 h-6 rounded-md border border-gray-200" style={{ backgroundColor: bgColor }}></div>
                                    </div>
                                    <input
                                        type="text"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-32"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Company URL</label>
                                <input
                                    type="text"
                                    value={companyUrl}
                                    onChange={(e) => setCompanyUrl(e.target.value)}
                                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Header</label>
                                <textarea
                                    value={header}
                                    onChange={(e) => setHeader(e.target.value)}
                                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[60px] resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Welcome message</label>
                                <textarea
                                    value={welcomeMsg}
                                    onChange={(e) => setWelcomeMsg(e.target.value)}
                                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[60px] resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* SEO */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('SEO')}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <span className="font-semibold text-white">Search engine optimization</span>
                        <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", openSection === 'SEO' && "rotate-180")} />
                    </button>
                    {openSection === 'SEO' && (
                        <div className="p-4 border-t border-white/5 space-y-4">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Meta title</label>
                                <input
                                    type="text"
                                    defaultValue={companyUrl}
                                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Meta description</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Button className="bg-blue-600 hover:bg-blue-500 text-white w-24">Save</Button>
            </div>

            {/* Right Column: Browser Preview */}
            <div className="w-full lg:w-[480px] bg-[#f0f2f5] rounded-xl overflow-hidden shadow-2xl flex flex-col border border-white/5">
                {/* Browser Toolbar */}
                <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2">
                    <div className="flex gap-1.5 ml-2 mr-4">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-md h-7"></div>
                </div>

                {/* Content */}
                <div className="flex-1 flex" style={{ backgroundColor: bgColor }}>
                    {/* Sidebar Area */}
                    <div className="w-1/3 p-6 flex flex-col items-center text-center pt-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{header}</h2>
                        <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                        <p className="text-sm text-gray-600">{welcomeMsg}</p>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 flex flex-col justify-end pb-8">
                        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 ml-auto max-w-[90%] relative">
                            <p className="text-sm text-gray-800">Hello 👋</p>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
                        </div>

                        <div className="bg-blue-600 rounded-2xl rounded-tr-none shadow-sm p-4 mb-4 ml-auto max-w-[90%] text-white">
                            <p className="text-sm">I've been looking for this model for ages!</p>
                        </div>

                        <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 mb-4 mr-auto max-w-[90%] text-gray-800">
                            <p className="text-sm">Let me check that for you real quick! We've just had a big delivery in the morning.</p>
                            <span className="text-lg">🔥</span>
                        </div>

                        <div className="flex items-center gap-2 justify-end mt-4">
                            <div className="bg-blue-600 rounded-2xl p-3 text-white text-xs">That's great! 🤩</div>
                        </div>
                        <div className="flex items-center gap-2 justify-end mt-2">
                            <div className="bg-blue-600 rounded-2xl p-3 text-white text-xs">Thank you very much!</div>
                        </div>

                        {/* Input Area */}
                        <div className="mt-4 bg-white rounded-full px-4 py-3 shadow-sm flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Enter your message...</span>
                            <Send size={16} className="text-gray-400" />
                        </div>
                    </div>

                    {/* Widget Trigger */}
                    <div className="absolute bottom-6 right-6 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <MessageSquare className="text-white" size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper icon
function Send({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
    )
}
