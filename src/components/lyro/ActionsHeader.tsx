"use client";

import { PlayCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ActionsHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-serif text-white mb-2">Actions</h1>
                <p className="text-slate-400 text-sm">
                    Lyro can perform actions across your apps and services via API calls, delivering a more engaging and personalized conversation experience for your customers.
                </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
                    <PlayCircle size={16} />
                    Test Lyro
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2">
                    <Plus size={16} />
                    Create Action
                </Button>
            </div>
        </div>
    );
}
