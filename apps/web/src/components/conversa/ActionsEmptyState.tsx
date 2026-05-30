"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ActionsEmptyState() {
    return (
        <div className="bg-[#ffffff] border border-gray-200 rounded-xl flex flex-col items-center justify-center min-h-[320px] p-8 text-center mb-12">

            <h2 className="text-xl font-bold text-gray-900 mb-2">You have no Actions yet</h2>
            <p className="text-slate-400 text-sm mb-8">
                Start creating your first Action or use one of our templates
            </p>

            <div className="flex items-center gap-3">
                <Link href="/panel/chatbot/actions/create">
                    <Button variant="outline" className="border-gray-200 text-gray-900 hover:bg-white/5">
                        Create from scratch
                    </Button>
                </Link>
                <Button className="bg-blue-600 hover:bg-blue-500 text-gray-900 border-0">
                    Explore templates
                </Button>
            </div>

        </div>
    );
}
