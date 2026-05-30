"use client";

import { ConversaSidebar } from '@/components/conversa/ConversaSidebar';
import { ProductsHeader } from '@/components/conversa/ProductsHeader';
import { ProductsEmptyState } from '@/components/conversa/ProductsEmptyState';

export default function ProductsPage() {
    return (
        <div className="flex h-full bg-[#f8fafc]">
            {/* Inner Sidebar */}
            <ConversaSidebar />

            <div className="flex-1 h-full overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8 lg:p-10">
                    <ProductsHeader />
                    <ProductsEmptyState />
                </div>
            </div>
        </div>
    );
}
