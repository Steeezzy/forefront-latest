"use client";

import { useEffect, useState } from "react";
import { Plus, Mail, Trash2, Shovel, Shield, UserCog, Check, X, CreditCard, Clock } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { resolveWorkspaceSession } from "@/lib/workspace-session";

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
        <div style={{ background: '#fafafa', minHeight: '100vh', width: '100%', padding: '28px 32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#09090b' }}>Workspace</h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Manage workspace settings and team members</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        style={{
                            background: '#09090b', color: 'white', height: '34px', padding: '0 16px',
                            borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none'
                        }}
                    >
                        + Invite Member
                    </button>
                </div>
            </div>

            {/* Plan Card */}
            <div style={{
                background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '20px',
                marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', background: '#fef3c7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={20} style={{ color: '#d97706' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#09090b' }}>Growth Plan</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Next invoice on April 15, 2026 for ₹2,400</div>
                    </div>
                </div>
                <button style={{
                    background: '#fff', border: '1px solid #e4e4e7', height: '34px', padding: '0 14px',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
                }}>
                    Upgrade Plan
                </button>
            </div>

            {/* Members Table */}
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginBottom: '16px' }}>Team Members</div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading members...</div>
            ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', background: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7' }}>
                    <Mail size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>No members yet</p>
                    <p style={{ fontSize: '13px' }}>Click "+ Invite" to add your team</p>
                </div>
            ) : (
                <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                                {['Member', 'Role', 'Status', 'Joined', 'Actions'].map((col, i) => (
                                    <th key={i} style={{ padding: '10px 16px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member) => (
                                <tr key={member.id} style={{ borderBottom: '1px solid #f4f4f5', transition: 'background 0.12s' }}>
                                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#09090b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '28px', height: '28px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                                                {member.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{member.name}</div>
                                                <div style={{ fontSize: '11px', color: '#6b7280' }}>{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <span style={{
                                            fontSize: '11px', padding: '3px 8px', borderRadius: '12px', fontWeight: 500,
                                            background: member.role === 'admin' ? '#e0f2fe' : member.role === 'member' ? '#dcfce7' : '#f4f4f5',
                                            color: member.role === 'admin' ? '#0369a1' : member.role === 'member' ? '#16a34a' : '#71717a'
                                        }}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4b5563' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.status === 'active' ? '#10b981' : '#f59e0b' }} />
                                            {member.status === 'active' ? 'Active' : 'Pending'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#6b7280' }}>
                                        {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Mar 15, 2026'}
                                    </td>
                                    <td style={{ padding: '13px 16px' }}>
                                        <button onClick={() => handleRemove(member.id)} style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', position: 'relative' }}>
                        <button onClick={() => setIsInviteOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                            <X size={18} />
                        </button>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#09090b' }}>Invite Member</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Add a new user to collaborate in your workspace</p>

                        <form onSubmit={handleInvite} style={{ marginTop: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#52525b', marginBottom: '6px' }}>Email Address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@example.com" required style={{ width: '100%', height: '36px', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#52525b', marginBottom: '6px' }}>Role</label>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    {['admin', 'member', 'viewer'].map(r => (
                                        <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize' }}>
                                            <input type="radio" checked={role === r} onChange={() => setRole(r as any)} /> {r}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" onClick={() => setIsInviteOpen(false)} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '0 16px', height: '34px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submitting || !email} style={{ background: '#09090b', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 16px', height: '34px', fontSize: '13px', cursor: 'pointer' }}>
                                    {submitting ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
