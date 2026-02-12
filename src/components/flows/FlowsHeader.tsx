"use client";

import { Import, Plus, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FlowsHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-white">My Flows</h1>

            <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
                    <Import size={16} />
                    Import
                </Button>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
                    <Plus size={16} />
                    Create from scratch
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2">
                    <FilePlus size={16} />
                    Add from template
                </Button>
            </div>
        </div>
    );
}
