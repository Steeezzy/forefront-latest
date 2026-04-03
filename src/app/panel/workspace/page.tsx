"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Mail, Trash2, CreditCard, Clock, Users, X, Check } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { resolveWorkspaceSession } from "@/lib/workspace-session";
import { cn } from "@/lib/utils";

interface Member {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    status: 'active' | 'pending';
    joined_at?: string;
}

export default function WorkspacePage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    
    // Form State
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
    const [submitting, setSubmitting] = useState(false);
    const [orgId, setOrgId] = useState("");

    const fetchMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            let workspaceId = orgId;
            if (!workspaceId) {
                const session = await resolveWorkspaceSession();
                workspaceId = session.workspaceId;
                setOrgId(workspaceId);
            }
            const res = await fetch(buildProxyUrl(`/api/workspace/members?orgId=${workspaceId}`));
            if (!res.ok) throw new Error("Failed to fetch members");
            const data = await res.json();
            setMembers(data.map((member: any) => ({
                ...member,
                name: member.name || member.email.split('@')[0]
            })));
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const workspaceId = orgId || (await resolveWorkspaceSession()).workspaceId;
            if (!orgId) setOrgId(workspaceId);
            const res = await fetch(buildProxyUrl("/api/workspace/invite"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId: workspaceId, email, role })
            });

            if (!res.ok) throw new Error("Failed to invite member");
            
            setIsInviteOpen(false);
            setEmail("");
            setRole("member");
            fetchMembers();
        } catch (err: any) {
            alert(err.message || "Failed to invite");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            const workspaceId = orgId || (await resolveWorkspaceSession()).workspaceId;
            if (!orgId) setOrgId(workspaceId);
            const res = await fetch(buildProxyUrl(`/api/workspace/members/${id}?orgId=${workspaceId}`), {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to remove member");
            fetchMembers();
        } catch (err: any) {
            alert(err.message || "Failed to remove");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0]">
                <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-7 w-7 text-[#0a192f]" />
                            <h1 className="text-2xl font-bold tracking-tight text-[#0a192f]">Workspace</h1>
                        </div>
                        <p className="text-sm text-[#64748b] font-medium">Manage workspace settings and team members</p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8 space-y-6">
                {/* Plan Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-[#fef3c7] flex items-center justify-center">
                                <CreditCard size={24} className="text-[#d97706]" />
                            </div>
                            <div>
                                <div className="text-base font-bold text-[#0a192f]">Growth Plan</div>
                                <div className="text-xs text-[#64748b] mt-1">Next invoice on April 15, 2026 for ₹2,400</div>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="rounded-lg border border-[#e2e8f0] bg-white px-5 py-2 text-sm font-medium text-[#64748b] hover:border-[#0a192f] hover:text-[#0a192f] transition-all"
                        >
                            Upgrade Plan
                        </motion.button>
                    </div>
                </motion.div>

                {/* Members Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0a192f] uppercase tracking-wider">Team Members</span>
                            <span className="text-xs text-[#64748b]">({members.length})</span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsInviteOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-[#0a192f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#112240] transition-all shadow-lg shadow-[#0a192f]/10"
                        >
                            <Plus size={16} />
                            Invite Member
                        </motion.button>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-[#64748b] bg-white rounded-2xl border border-[#e2e8f0]">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <div className="h-4 w-4 rounded-full border-2 border-[#0a192f] border-t-transparent animate-spin" />
                                <span className="text-sm font-medium">Loading members...</span>
                            </div>
                        </div>
                    ) : members.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#e2e8f0] text-center"
                        >
                            <div className="h-16 w-16 rounded-full bg-[#f8fafc] flex items-center justify-center mb-4">
                                <Mail size={32} className="text-[#94a3b8]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0a192f] mb-2">No members yet</h3>
                            <p className="text-sm text-[#64748b] mb-6 max-w-xs">Build your team by inviting colleagues to collaborate in your workspace.</p>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsInviteOpen(true)}
                                className="rounded-lg bg-[#0a192f] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#112240] transition-all"
                            >
                                Invite First Member
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_60px] border-b border-[#e2e8f0] bg-[#f8fafc]">
                                {['Member', 'Role', 'Status', 'Joined', ''].map((col, i) => (
                                    <div key={i} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                                        {col}
                                    </div>
                                ))}
                            </div>
                            <div>
                                {members.map((member, idx) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr_60px] items-center border-b border-[#f1f5f9] last:border-0 px-4 py-3.5 hover:bg-[#f8fafc] transition-colors"
                                    >
                                        {/* Member */}
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0a192f] to-[#3b82f6] flex items-center justify-center text-sm font-bold text-white">
                                                {member.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-[#0a192f]">{member.name}</div>
                                                <div className="text-xs text-[#64748b]">{member.email}</div>
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div>
                                            <span className={cn(
                                                "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold",
                                                member.role === 'admin' ? "bg-[#0a192f]/10 text-[#0a192f]" :
                                                member.role === 'member' ? "bg-[#3b82f6]/10 text-[#3b82f6]" :
                                                "bg-[#f1f5f9] text-[#64748b]"
                                            )}>
                                                {member.role}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className={cn(
                                                "h-2 w-2 rounded-full",
                                                member.status === 'active' ? "bg-[#10b981]" : "bg-[#f59e0b]"
                                            )} />
                                            <span className={cn(
                                                member.status === 'active' ? "text-[#10b981]" : "text-[#f59e0b]"
                                            )}>
                                                {member.status === 'active' ? 'Active' : 'Pending'}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div className="text-xs text-[#64748b]">
                                            {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Mar 15, 2026'}
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleRemove(member.id)}
                                                className="rounded-lg border border-[#fecaca] bg-white px-3 py-1 text-xs font-medium text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                                            >
                                                Remove
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            <AnimatePresence>
                {isInviteOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setIsInviteOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                                <h2 className="text-lg font-bold text-[#0a192f]">Invite Member</h2>
                                <button 
                                    onClick={() => setIsInviteOpen(false)}
                                    className="rounded-lg p-1 text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleInvite} className="p-6 space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                                        Email Address
                                    </label>
                                    <input 
                                        type="email" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        placeholder="teammate@example.com"
                                        required
                                        className="w-full rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/10 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                                        Role
                                    </label>
                                    <div className="flex gap-3">
                                        {(['admin', 'member', 'viewer'] as const).map((r) => (
                                            <label
                                                key={r}
                                                className={cn(
                                                    "flex-1 cursor-pointer",
                                                    role === r ? "opacity-100" : "opacity-60 hover:opacity-80"
                                                )}
                                            >
                                                <input 
                                                    type="radio" 
                                                    checked={role === r} 
                                                    onChange={() => setRole(r)}
                                                    className="sr-only"
                                                />
                                                <div className={cn(
                                                    "rounded-xl border-2 px-4 py-2.5 text-center text-sm font-medium transition-all",
                                                    role === r
                                                        ? "border-[#0a192f] bg-[#0a192f]/5 text-[#0a192f]"
                                                        : "border-[#e2e8f0] text-[#64748b] hover:border-[#94a3b8]"
                                                )}>
                                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-[#94a3b8]">
                                        {role === 'admin' && "Full access including billing and team management."}
                                        {role === 'member' && "Can create and manage agents, view analytics."}
                                        {role === 'viewer' && "Read-only access to view data and reports."}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => setIsInviteOpen(false)}
                                        className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#64748b] hover:border-[#0a192f] hover:text-[#0a192f]"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={submitting || !email}
                                        className="rounded-xl bg-[#0a192f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#112240] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0a192f]/20"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                Sending...
                                            </span>
                                        ) : (
                                            "Send Invite"
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
