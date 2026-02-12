"use client";

import { ShoppingBag, ArrowRight, ShoppingCart, DollarSign, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SalesGridProps {
    activeTab: string;
}

export function SalesGrid({ activeTab }: SalesGridProps) {

    // Featured Card Content based on active tab
    const getFeaturedCard = () => {
        if (activeTab === 'Win back') {
            return (
                <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-900/20 to-[#18181b] border border-blue-500/30 rounded-xl p-8 relative overflow-hidden group">
                    <div className="relative z-10 w-2/3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-white">
                            <RotateCcw size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Cart Abandoned</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                            Learn why your customers abandon their carts and convince them to a purchase with a discount.
                        </p>
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <span className="bg-zinc-700 w-1 h-3 rounded-full"></span>
                            11.4K uses
                        </div>
                    </div>

                    {/* Mock UI Element */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-64 bg-white rounded-xl shadow-2xl p-4 rotate-6 group-hover:rotate-3 transition-transform duration-500">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <div className="h-2 w-24 bg-zinc-100 rounded mb-1"></div>
                                <div className="h-2 w-12 bg-zinc-100 rounded"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-8 w-full bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-800">
                                Save 10% on this order
                            </div>
                            <div className="h-8 w-full bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-center text-[10px] text-zinc-400">
                                Get the code now 🚀
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Default Featured Card (Close Deals / All)
        return (
            <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-900/20 to-[#18181b] border border-blue-500/30 rounded-xl p-8 relative overflow-hidden group">
                <div className="relative z-10 w-2/3">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-white">
                        <ShoppingCart size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Cart Booster</h3>
                    <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                        Convince your customers to buy, by offering them a small discount in the cart.
                    </p>
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <span className="bg-zinc-700 w-1 h-3 rounded-full"></span>
                        5.3K uses
                    </div>
                </div>

                {/* Mock UI Element */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-64 bg-white rounded-xl shadow-2xl p-4 rotate-6 group-hover:rotate-3 transition-transform duration-500">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-500">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <div className="h-2 w-24 bg-zinc-100 rounded mb-1"></div>
                            <div className="h-2 w-12 bg-zinc-100 rounded"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-8 w-full bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-800">
                            Save 10% on this order
                        </div>
                        <div className="h-8 w-full bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-center text-[10px] text-zinc-400">
                            Get the code now 🚀
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">

            {getFeaturedCard()}

            {/* Standard Card 1 */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                    <RotateCcw size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Win back</span>
                </div>
                <h4 className="text-white font-bold mb-2">Product removed from the cart</h4>
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                    Help customers when they remove items from the cart.
                </p>
                <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                    <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                    1.1K uses
                </div>
            </div>

            {/* Standard Card 2 - Close Deals */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                    <ShoppingCart size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Close deals</span>
                </div>
                <h4 className="text-white font-bold mb-2">Discount for new visitors</h4>
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                    Offer your Visitor a small discount for their first shopping and increase Conversion Rate.
                </p>
                <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                    <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                    2.1K uses
                </div>
            </div>

            {/* Standard Card 3 - Close Deals */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                    <ShoppingCart size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Close deals</span>
                </div>
                <h4 className="text-white font-bold mb-2">Spinning Wheel</h4>
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                    Add a fun activity and increase customer interaction with the spinning wheel.
                </p>
                <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                    <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                    1.1K uses
                </div>
            </div>

            {/* Standard Card 4 - Close Deals */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                    <ShoppingCart size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Close deals</span>
                </div>
                <h4 className="text-white font-bold mb-2">Place an order bot</h4>
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                    Let your customers place an order during the live conversation.
                </p>
                <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                    <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                    6K uses
                </div>
            </div>

            {/* Standard Card 5 - Close Deals */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-2 mb-4 text-zinc-500 group-hover:text-blue-500 transition-colors">
                    <ShoppingCart size={16} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Close deals</span>
                </div>
                <h4 className="text-white font-bold mb-2">Free Shipping Unlocked (Cart Value)</h4>
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-6">
                    Inform visitors about available discounts or free shipping when specific cart conditions are met.
                </p>
                <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                    <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                    461 uses
                </div>
            </div>

            {/* Request Template Card */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col justify-center items-start min-h-[250px]">
                <h4 className="text-white font-bold text-lg mb-4">Haven't found what you want?</h4>
                <Button className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-0">
                    Request template
                </Button>
            </div>

        </div>
    );
}
