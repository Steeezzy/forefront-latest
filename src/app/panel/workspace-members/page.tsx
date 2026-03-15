"use client";

import { useEffect, useState } from "react";
import { Plus, Mail, Trash2, Shield, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Member {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    status: 'active' | 'pending';
    joined_at?: string;
}

export default function WorkspaceMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    
    // Form State
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
    const [submitting, setSubmitting] = useState(false);

    const orgId = "test";

    const fetchMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8000/api/workspace/members?orgId=${orgId}`);
            if (!res.ok) throw new Error("Failed to fetch members");
            const data = await res.json();
            setMembers(data);
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
            const res = await fetch(`http://localhost:8000/api/workspace/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    email,
                    role,
                    status: "pending"
                })
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
            const res = await fetch(`http://localhost:8000/api/workspace/members/${id}?orgId=${orgId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to remove member");
            fetchMembers();
        } catch (err: any) {
            alert(err.message || "Failed to remove");
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-blue-500/10 text-[#7c5cfc] hover:bg-blue-500/10 border-none capitalize">{role}</Badge>;
            case 'member':
                return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-none capitalize">{role}</Badge>;
            default:
                return <Badge className="bg-slate-500/10 text-slate-400 hover:bg-slate-500/10 border-none capitalize">{role}</Badge>;
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#f0f0f2]">Workspace Members</h1>
                    <p className="text-sm text-[#8b8b9a] mt-1">Manage team members and their access levels</p>
                </div>

                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-gray-900 gap-2">
                            <Plus className="h-4 w-4" /> Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px] bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                        <DialogHeader>
                            <DialogTitle>Invite Member</DialogTitle>
                            <DialogDescription className="text-[#8b8b9a]">
                                Add a new member to your workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#f0f0f2]">Email Address</Label>
                                <Input 
                                    id="email" 
                                    type="email"
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="teammate@example.com"
                                    className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#f0f0f2]">Role</Label>
                                <Select value={role} onValueChange={(v: "admin" | "member" | "viewer") => setRole(v)}>
                                    <SelectTrigger className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter>
                                <Button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-gray-900 w-full"
                                >
                                    {submitting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                                    Send Invite
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner className="h-8 w-8 text-[#7c5cfc]" />
                </div>
            ) : error ? (
                <div className="text-red-500 text-center py-10 bg-[#ffffff] rounded-xl border border-[#e5e7eb]">
                    Error: {error}
                </div>
            ) : members.length === 0 ? (
                <Empty className="border-[#e5e7eb] bg-[#ffffff]/50">
                    <EmptyHeader>
                        <EmptyTitle>No Members Found</EmptyTitle>
                        <EmptyDescription>Invite team members to collaborate.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[#ffffff]">
                            <TableRow className="border-b-[#e5e7eb] hover:bg-transparent">
                                <TableHead className="text-[#f0f0f2]">Name</TableHead>
                                <TableHead className="text-[#f0f0f2]">Email</TableHead>
                                <TableHead className="text-[#f0f0f2]">Role</TableHead>
                                <TableHead className="text-[#f0f0f2]">Status</TableHead>
                                <TableHead className="text-[#f0f0f2]">Joined</TableHead>
                                <TableHead className="text-right text-[#f0f0f2]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id} className="border-b-[#e5e7eb] hover:bg-[#e5e7eb]/20">
                                    <TableCell className="font-medium text-[#f0f0f2] flex items-center gap-2">
                                        {member.name || `User-${member.id.substring(0, 4)}`}
                                    </TableCell>
                                    <TableCell className="text-[#8b8b9a] flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5 text-[#8b8b9a]" />
                                        {member.email}
                                    </TableCell>
                                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "border-none",
                                            member.status === 'active' 
                                                ? "bg-emerald-500/10 text-emerald-500" 
                                                : "bg-slate-500/10 text-slate-400"
                                        )}>
                                            {member.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[#8b8b9a] text-sm">
                                        {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Pending'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-[#8b8b9a] hover:text-[#f0f0f2]"
                                            >
                                                <UserCog className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleRemove(member.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
