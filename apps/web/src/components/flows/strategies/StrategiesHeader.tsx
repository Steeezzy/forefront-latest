"use client";

import { Gift } from 'lucide-react';

export function StrategiesHeader() {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Strategies</h1>
            <p className="text-zinc-400 text-sm mb-6">
                Find the best growth-hacking tactics for your business with ready-to-use Flow strategies.
            </p>

            {/* Promo Banner */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="bg-orange-500/20 p-1.5 rounded-md">
                    <Gift className="text-orange-400" size={16} />
                </div>
                <p className="text-orange-300 text-sm font-medium">
                    Use one of the Flow strategies now to get <span className="font-bold">UNLIMITED FLOWS FOR 7 DAYS.</span>
                </p>
            </div>
        </div>
    );
}
