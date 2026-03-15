"use client";

export function IdentitySettings() {
    return (
        <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 mb-6">
            <div className="mb-6">
                <h3 className="text-gray-900 font-semibold mb-1">Identity</h3>
                <p className="text-slate-400 text-sm">Change the name of your AI Agent and add your company description.</p>
            </div>

            <div className="space-y-6 max-w-2xl">
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">AI Agent name</label>
                    <p className="text-xs text-slate-500 mb-2">AI Agent uses this name when answering questions about their identity</p>
                    <input
                        type="text"
                        defaultValue="Conversa"
                        className="w-full h-10 px-3 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Company description</label>
                    <p className="text-xs text-slate-500 mb-2">Describe your business so the AI Agent can tailor responses to your customers</p>
                    <textarea
                        className="w-full h-32 p-3 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
