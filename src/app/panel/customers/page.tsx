"use client";

import { useState } from "react";
import { Users, Search, Plus, Filter, Download, MoreHorizontal } from "lucide-react";

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50/50">
            {/* Header */}
            <div className="px-8 py-6 border-b border-zinc-200 bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Customers</h1>
                        <p className="text-sm text-zinc-500 mt-1">Manage your contacts and customer history.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="h-9 px-4 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 flex items-center gap-2">
                            <Download size={16} /> Export
                        </button>
                        <button className="h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 flex items-center gap-2 shadow-sm">
                            <Plus size={16} /> Add Customer
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    
                    {/* Filters */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or phone number..."
                                className="w-full pl-9 pr-4 h-10 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                            />
                        </div>
                        <button className="h-10 px-4 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 flex items-center gap-2">
                            <Filter size={16} /> Filters
                        </button>
                    </div>

                    {/* Empty State / List */}
                    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm text-center py-24">
                        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="text-zinc-400" size={24} />
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-900 mb-1">No customers found</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
                            You don't have any customers in your current active workspace directory. Import contacts or add one manually to get started.
                        </p>
                        <button className="h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 inline-flex items-center shadow-sm">
                            Import Contacts
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
