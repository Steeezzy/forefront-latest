"use client";

import { ActionsCreateForm } from '@/components/lyro/ActionsCreateForm';

export default function CreateActionPage() {
    return (
        <div className="flex-1 h-full bg-[#0f1115] overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8 lg:p-10 min-h-full">
                <ActionsCreateForm />
            </div>
        </div>
    );
}
