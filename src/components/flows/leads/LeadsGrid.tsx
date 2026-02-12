"use client";

import { Mail, Download, Leaf, CheckCircle, Calendar, Phone, FileText, Megaphone, Smartphone, User, Home, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeadsGridProps {
    activeTab: string;
}

export function LeadsGrid({ activeTab }: LeadsGridProps) {

    // Featured Card Content
    const renderFeaturedCard = () => (
        <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-purple-900/20 to-[#18181b] border border-purple-500/30 rounded-xl p-8 relative overflow-hidden group">
            <div className="relative z-10 w-2/3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-white">
                    <Mail size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Lead Magnet / Subscribe Form</h3>
                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                    Automate your lead generation and collect visitors' contact information.
                </p>
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                    <span className="bg-zinc-700 w-1 h-3 rounded-full"></span>
                    66.2K uses
                </div>
            </div>

            {/* Mock UI Element */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-64 bg-white rounded-xl shadow-2xl p-4 rotate-6 group-hover:rotate-3 transition-transform duration-500">
                <p className="text-[10px] text-zinc-500 mb-2 font-medium">Subscribe now and receive our latest promotions! 🎉</p>

                <div className="flex gap-2 mb-2">
                    <button className="flex-1 bg-blue-600 text-white text-[10px] py-1.5 rounded font-medium">Subscribe me</button>
                    <button className="flex-1 bg-zinc-100 text-zinc-500 text-[10px] py-1.5 rounded font-medium">No, thanks</button>
                </div>

                <div className="h-1.5 w-16 bg-zinc-100 rounded mx-auto"></div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">

            {/* Render Featured Card primarily for 'Gather' and 'All' views */}
            {(activeTab === 'All' || activeTab === 'Gather') && renderFeaturedCard()}


            {/* Gather Cards */}
            {(activeTab === 'All' || activeTab === 'Gather') && (
                <>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Download size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Gather</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Lead generation bot</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Engage and generate more leads. Collect e-mail addresses or phone numbers.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            94.6K uses
                        </div>
                    </div>

                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Download size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Gather</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Order a phone call</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Collect phone numbers to reach your customers by phone call or SMS.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            24.3K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Download size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Gather</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Appointment booking</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Enhance customer convenience and streamline your business operations by integrating this easy-to-use appointment booking solution.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            3.4K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Download size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Gather</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Gated Content Download</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Enhance user engagement and gather valuable leads while offering a seamless experience of accessing gated resources hassle-free!
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            194 uses
                        </div>
                    </div>

                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Download size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Gather</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Book a Call with Calendly</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Allow visitors to book appointments seamlessly using a custom Calendly Link.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            994 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Download size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Gather</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Book a Call with Appointlet</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Allow visitors to book appointments seamlessly using a custom Appointlet Link.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            65 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Download size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Gather</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Virtual Event Magnet</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Promote upcoming virtual events, encouraging visitors to share their contact details and reserve their spot.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            25 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Download size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Gather</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Book a Call with Acuity Scheduling</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Allow visitors to book appointments seamlessly using a custom Acuity Scheduling Link.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            79 uses
                        </div>
                    </div>
                </>
            )}

            {/* Nurture Cards */}
            {(activeTab === 'All' || activeTab === 'Nurture') && (
                <>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Leaf size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Nurture</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">News & Updates</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Keep your visitors up to date with your new offers and upcoming events.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            2.1K uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Leaf size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Nurture</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Boost Social Media Presence (After-Chat)</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Improve your online presence by sharing links to your Instagram and Facebook when you mark a conversation as solved.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            554 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Leaf size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Nurture</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Launch Day</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Generate excitement and acquire leads for your upcoming product or service. Collects email and name information and subscribes visitors to...
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            94 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Leaf size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Nurture</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Mobile App Promoter</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Direct users to the appropriate app store for a quick and easy download, ensuring a seamless user experience.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            74 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <Leaf size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Nurture</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Article Booster</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Increase engagement with articles, gather feedback, while also enticing readers to subscribe to newsletters.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            58 uses
                        </div>
                    </div>
                </>
            )}

            {/* Qualify Cards */}
            {(activeTab === 'All' || activeTab === 'Qualify') && (
                <>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <CheckCircle size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Qualify</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Lead Gen For Beauty</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Elevate your lead generation strategy by engaging visitors, offering tailored beauty consultations, and capturing essential information.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            172 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <CheckCircle size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Qualify</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Request a quote agency</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Streamline your agency's lead generation by interacting with visitors, understanding their needs, and providing clear paths to request service quotes.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            110 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <CheckCircle size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Qualify</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Request a quote photo & video</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Simplify booking for photography and videography services by engaging potential clients and capturing their event details directly.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            30 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <CheckCircle size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Qualify</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Lead Gen for Agency (Short)</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Efficiently capture leads with a concise flow designed for agencies, focusing on quick engagement and essential data collection.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            24 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <CheckCircle size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Qualify</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Table Booking</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Facilitate seamless restaurant reservations by engaging diners and collecting booking details effortlessly.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            67 uses
                        </div>
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                            <CheckCircle size={16} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Qualify</span>
                        </div>
                        <h4 className="text-white font-bold mb-2">Real Estate Quote</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                            Connect with potential property buyers or sellers, engaging them to gather preferences and provide tailored real estate quotes.
                        </p>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                            <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                            179 uses
                        </div>
                    </div>
                </>
            )}

            {/* Request Template Card - Always visible or conditional based on design preference */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col justify-center items-start min-h-[200px]">
                <h4 className="text-white font-bold text-lg mb-4">Haven't found what you want?</h4>
                <Button className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0">
                    Request template
                </Button>
            </div>

        </div>
    );
}
