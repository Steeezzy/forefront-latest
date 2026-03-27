"use client";

import { User, Mail, Shield, Key, Loader2, Save } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
    const [submitting, setSubmitting] = useState(false);

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50/50">
            {/* Header */}
            <div className="px-8 py-6 border-b border-zinc-200 bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Your Profile</h1>
                        <p className="text-sm text-zinc-500 mt-1">Manage your account settings and preferences.</p>
                    </div>
                    <button 
                        onClick={() => {
                            setSubmitting(true);
                            setTimeout(() => setSubmitting(false), 800);
                        }}
                        disabled={submitting}
                        className="h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    
                    {/* Basic Info */}
                    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 text-zinc-900 font-medium">
                            <User size={18} className="text-zinc-500" /> Personal Information
                        </div>
                        <div className="p-6 space-y-6">
                            
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-200 transition-colors">
                                    <span className="text-lg font-semibold text-zinc-600">Q</span>
                                    <span className="text-[10px] text-zinc-400 mt-1">Change</span>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700">First name</label>
                                            <input type="text" defaultValue="Admin" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700">Last name</label>
                                            <input type="text" defaultValue="User" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-700">Email address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                            <input type="email" defaultValue="admin@qestron.com" disabled className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-500 cursor-not-allowed" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Security */}
                     <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 text-zinc-900 font-medium">
                            <Shield size={18} className="text-zinc-500" /> Security
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg bg-zinc-50/50">
                                <div>
                                    <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                        <Key size={14} className="text-zinc-500" /> Change Password
                                    </h4>
                                    <p className="text-sm text-zinc-500 mt-1">Update your password to keep your account secure.</p>
                                </div>
                                <button className="h-9 px-4 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50">
                                    Update Password
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
