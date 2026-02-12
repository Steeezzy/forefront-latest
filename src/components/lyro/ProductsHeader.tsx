"use client";

import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductsHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Products</h1>
                <p className="text-slate-400 text-sm">Provide your product listing so Lyro can answer product-related questions.</p>
            </div>

            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2 w-fit">
                <PlayCircle size={16} />
                Test Lyro
            </Button>
        </div>
    );
}
