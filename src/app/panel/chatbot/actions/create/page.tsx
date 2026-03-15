"use client";

import { ActionsCreateForm } from '@/components/conversa/ActionsCreateForm';

export default function CreateActionPage() {
    return (
        <div className="flex-1 h-full bg-[#f8fafc] overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8 lg:p-10 min-h-full">
                <ActionsCreateForm />
            </div>
        </div>
    );
}
