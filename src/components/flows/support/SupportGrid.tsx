"use client";

import { HelpCircle, Zap, Split, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupportGridProps {
    activeTab: string;
}

export function SupportGrid({ activeTab }: SupportGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">

            {/* Render Heroes based on Tab */}
            {(activeTab === 'All' || activeTab === 'Deflect') && (
                <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-900/20 to-[#18181b] border border-blue-500/30 rounded-xl p-8 relative overflow-hidden group">
                    <div className="relative z-10 w-2/3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-white">
                            <HelpCircle size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">FAQ for Online Store</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                            Reduce repetitive questions about shipping, returns, order status and more.
                        </p>
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <span className="bg-zinc-700 w-1 h-3 rounded-full"></span>
                            2.1K uses
                        </div>
                    </div>

                    {/* Mock UI Element */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-64 bg-white rounded-xl shadow-2xl p-4 rotate-6 group-hover:rotate-3 transition-transform duration-500">
                        <p className="text-[10px] text-zinc-500 mb-2 font-medium">How can we help you today?</p>
                        <div className="flex flex-col gap-1.5">
                            <button className="w-full bg-zinc-100 text-zinc-600 text-[10px] py-1.5 rounded text-left px-3 hover:bg-blue-50 transition-colors">📦 Shipping & Delivery</button>
                            <button className="w-full bg-zinc-100 text-zinc-600 text-[10px] py-1.5 rounded text-left px-3 hover:bg-blue-50 transition-colors">🔍 Track my Order</button>
                        </div>
                    </div>
                </div>
            )}

            {(activeTab === 'Initiate') && (
                <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-purple-900/20 to-[#18181b] border border-purple-500/30 rounded-xl p-8 relative overflow-hidden group">
                    <div className="relative z-10 w-2/3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Autoresponder for Story Reply (Reactions)</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                            Answer every Story Reply reaction to boost the engagement of your followers!
                        </p>
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <span className="bg-zinc-700 w-1 h-3 rounded-full"></span>
                            2.6K uses
                        </div>
                    </div>

                    {/* Mock UI Element - Instagram Reactions */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-60 bg-white rounded-xl shadow-2xl p-4 rotate-6 group-hover:rotate-3 transition-transform duration-500 text-center">
                        <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex justify-center gap-2 mb-3 text-lg">
                            <span>😂</span><span>😍</span><span>🔥</span><span>💯</span>
                        </div>
                        <p className="text-[10px] text-zinc-800 font-bold bg-zinc-100 py-1 rounded">Thanks for your reaction!</p>
                    </div>
                </div>
            )}

            {(activeTab === 'Triage') && (
                <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-slate-800/40 to-[#18181b] border border-slate-500/30 rounded-xl p-8 relative overflow-hidden group">
                    <div className="relative z-10 w-2/3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Split size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Handle missed conversations</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                            Never leave anyone without a reply. Build trust, and your mailing list.
                        </p>
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <span className="bg-zinc-700 w-1 h-3 rounded-full"></span>
                            22.2K uses
                        </div>
                    </div>

                    {/* Mock UI Element */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-64 bg-white rounded-xl shadow-2xl p-4 rotate-6 group-hover:rotate-3 transition-transform duration-500">
                        <div className="flex items-start gap-2 mb-2">
                            <div className="w-8 h-8 bg-yellow-400 rounded-full flex-shrink-0">
                                {/* Avatar placeholder */}
                            </div>
                            <div className="bg-zinc-100 p-2 rounded-xl rounded-tl-none text-[10px] text-zinc-600">
                                Sorry for keeping you waiting, we'll get back to you as soon as possible. Thank you for your patience.
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Deflect Cards */}
            {(activeTab === 'All' || activeTab === 'Deflect') && (
                <>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Shield size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Deflect</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Send a PDF User Guide</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Provide instant support with user manuals or other useful documentation.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            964 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Shield size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Deflect</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Digital Menu</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Provide your customers with access to your menu and help them place an order.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            181 uses
                        </div>
                    </div>
                </>
            )}

            {/* Initiate Cards */}
            {(activeTab === 'All' || activeTab === 'Initiate') && (
                <>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Zap size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Initiate</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Leaving the page</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Decrease your bounce rate. Message every visitor who leaves your website.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            11.1K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Zap size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Initiate</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Reactive Welcome Message</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            You can actively engage in the conversation when you see the chat intent.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            5.8K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Zap size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Initiate</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Judge.me - Rating Protector</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Engage your customers on live chat before they post a negative review. Turn a bad experience into an opportunity.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            725 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Zap size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Initiate</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Judge.me - thank for a positive review</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Thank your customer for posting a positive review. Engage in a conversation and build longlasting relationship.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            296 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Zap size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Initiate</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Multilingual Greeting Messages</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Welcome your visitors in various languages, ensuring a personalized and inclusive greeting experience for all.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            232 uses
                        </div>
                    </div>
                </>
            )}

            {/* Triage Cards */}
            {(activeTab === 'All' || activeTab === 'Triage') && (
                <>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Split size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Triage</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Respond to greetings (AI)</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Set up automatic greeting messages & say hello to everyone.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            7.9K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Split size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Triage</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Keep in touch on weekends</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Improve customer support experience on Saturdays and Sundays when you're offline.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            6.3K uses
                        </div>
                    </div>
                </>
            )}

            {/* Self-service Cards */}
            {(activeTab === 'All' || activeTab === 'Self-service') && (
                <>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Sparkles size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Self-service</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Automate Repetitive Answers</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Arm yourself in the 3rd hand and save time on answering to most repetitive questions.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            27.1K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Sparkles size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Self-service</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">AI Responder</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Automate up to 75% repetitive questions like "Hi", "Where can I ..." to save time.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            16.5K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Sparkles size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Self-service</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Track Your Order (Shopify)</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Enable users to conveniently track their order status by entering their order number or email directly within the chat.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            1.1K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Sparkles size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Self-service</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Advanced Return Requests</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Optimize the return request process by efficiently collecting necessary details, evaluating eligibility, and guiding users through the return procedure.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            1.3K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Sparkles size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Self-service</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Shipping zones bot</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Let your customers know whether delivery to their location is possible.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            1.2K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Sparkles size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Self-service</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Product availability bot</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Inform customers about product availability. If an item is unavailable, the bot asks for their email.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            1K uses
                        </div>
                    </div>
                </>
            )}


            {/* Request Template Card */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col justify-center items-start min-h-[200px]">
                <h4 className="text-white font-bold text-lg mb-4">Haven't found what you want?</h4>
                <Button className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0">
                    Request template
                </Button>
            </div>

        </div>
    );
}
