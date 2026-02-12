import React from 'react';
import { Button } from '@/components/ui/button';

interface EmailTableProps {
    headers: string[];
    data: any[];
    renderRow?: (item: any, index: number) => React.ReactNode;
    emptyStateMessage: string;
    emptyStateAction?: React.ReactNode;
}

export function EmailTable({ headers, data, renderRow, emptyStateMessage, emptyStateAction }: EmailTableProps) {
    return (
        <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid border-b border-white/5 bg-white/2" style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}>
                {headers.map((header, index) => (
                    <div key={index} className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {header}
                    </div>
                ))}
            </div>

            {/* Body */}
            <div>
                {data.length > 0 ? (
                    data.map((item, index) => (
                        <div key={index} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                            {renderRow ? renderRow(item, index) : (
                                <div className="grid px-6 py-4 items-center" style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}>
                                    {Object.values(item).map((val: any, i) => (
                                        <div key={i} className="text-sm text-zinc-300">{val}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                        <p className="text-zinc-500 text-sm mb-4">{emptyStateMessage}</p>
                        {emptyStateAction}
                    </div>
                )}
            </div>
        </div>
    );
}
