"use client";

import { ConversaSidebar } from '@/components/conversa/ConversaSidebar';
import { DataSourcesHeader } from '@/components/conversa/DataSourcesHeader';
import { DataSourcesFilterBar } from '@/components/conversa/DataSourcesFilterBar';
import { DataSourcesTable } from '@/components/conversa/DataSourcesTable';

export default function DataSourcesPage() {
    return (
        <div className="flex h-full bg-[#f8fafc]">
            {/* Inner Sidebar */}
            <ConversaSidebar />

            <div className="flex-1 h-full overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8 lg:p-10">
                    <DataSourcesHeader />
                    <DataSourcesFilterBar />
                    <DataSourcesTable />
                </div>
            </div>
        </div>
    );
}
