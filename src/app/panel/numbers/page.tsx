"use client";

import { useEffect, useState } from "react";
import { Plus, PhoneCall, Trash2, Link2, Globe } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PhoneNumber {
    id: string;
    phone_number: string;
    country: string;
    type: 'local' | 'toll-free';
    status: 'active' | 'pending' | 'released';
    assigned_agent_id?: string;
    assigned_agent_name?: string;
}

interface VoiceAgent {
    id: string;
    name: string;
}

export default function NumbersPage() {
    const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGetOpen, setIsGetOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);

    // Form State (Get Number)
    const [country, setCountry] = useState("US");
    const [type, setType] = useState<"local" | "toll-free">("local");
    const [submitting, setSubmitting] = useState(false);

    // Form State (Assign)
    const [selectedAgent, setSelectedAgent] = useState("");

    const orgId = "test";

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8000/api/numbers?orgId=${orgId}`);
            if (!res.ok) throw new Error("Failed to fetch numbers");
            const data = await res.json();
            setNumbers(data);

            const agentRes = await fetch(`http://localhost:8000/api/voice-agents?orgId=${orgId}`);
            if (agentRes.ok) {
                const agentData = await agentRes.json();
                setAgents(agentData);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGetNumber = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`http://localhost:8000/api/numbers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    country,
                    type,
                    status: "active"
                })
            });

            if (!res.ok) throw new Error("Failed to get number");
            
            setIsGetOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to get number");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedNumber) return;
        setSubmitting(true);
        try {
            const res = await fetch(`http://localhost:8000/api/numbers/${selectedNumber.id}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    agent_id: selectedAgent
                })
            });

            if (!res.ok) throw new Error("Failed to assign agent");
            
            setIsAssignOpen(false);
            setSelectedNumber(null);
            setSelectedAgent("");
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to assign");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRelease = async (id: string) => {
        if (!confirm("Are you sure you want to release this number?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/numbers/${id}/release?orgId=${orgId}`, {
                method: "POST"
            });
            if (!res.ok) throw new Error("Failed to release number");
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to release");
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#f0f0f2]">Phone Numbers</h1>
                    <p className="text-sm text-[#8b8b9a] mt-1">Manage virtual numbers for incoming/outgoing calls</p>
                </div>

                <Dialog open={isGetOpen} onOpenChange={setIsGetOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-gray-900 gap-2">
                            <Plus className="h-4 w-4" /> Get Number
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px] bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                        <DialogHeader>
                            <DialogTitle>Get Virtual Number</DialogTitle>
                            <DialogDescription className="text-[#8b8b9a]">
                                Rent a new phone number for your workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleGetNumber} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[#f0f0f2]">Country</Label>
                                <Select value={country} onValueChange={setCountry}>
                                    <SelectTrigger className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                        <SelectItem value="US">🇺🇸 United States</SelectItem>
                                        <SelectItem value="IN">🇮🇳 India</SelectItem>
                                        <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#f0f0f2]">Number Type</Label>
                                <Select value={type} onValueChange={(v: "local" | "toll-free") => setType(v)}>
                                    <SelectTrigger className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                        <SelectItem value="local">Local</SelectItem>
                                        <SelectItem value="toll-free">Toll-Free</SelectItem>
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
                                    Buy Number
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Assign Modal */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="sm:max-w-[400px] bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                    <DialogHeader>
                        <DialogTitle>Assign Voice Agent</DialogTitle>
                        <DialogDescription className="text-[#8b8b9a]">
                            Route calls from {selectedNumber?.phone_number} to an AI.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignAgent} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[#f0f0f2]">Select Agent</Label>
                            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                <SelectTrigger className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                    <SelectValue placeholder="Choose Agent" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                    {agents.length === 0 ? (
                                        <SelectItem value="none" disabled>No agents found</SelectItem>
                                    ) : (
                                        agents.map((agent) => (
                                            <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button 
                                type="submit" 
                                disabled={submitting || !selectedAgent}
                                className="bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-gray-900 w-full"
                            >
                                {submitting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                                Assign Agent
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner className="h-8 w-8 text-[#7c5cfc]" />
                </div>
            ) : error ? (
                <div className="text-red-500 text-center py-10 bg-[#ffffff] rounded-xl border border-[#e5e7eb]">
                    Error: {error}
                </div>
            ) : numbers.length === 0 ? (
                <Empty className="border-[#e5e7eb] bg-[#ffffff]/50">
                    <EmptyHeader>
                        <EmptyTitle>No Numbers Found</EmptyTitle>
                        <EmptyDescription>Get a phone number to start routing calls through AI agents.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[#ffffff]">
                            <TableRow className="border-b-[#e5e7eb] hover:bg-transparent">
                                <TableHead className="text-[#f0f0f2]">Number</TableHead>
                                <TableHead className="text-[#f0f0f2]">Country</TableHead>
                                <TableHead className="text-[#f0f0f2]">Type</TableHead>
                                <TableHead className="text-[#f0f0f2]">Status</TableHead>
                                <TableHead className="text-[#f0f0f2]">Assigned Agent</TableHead>
                                <TableHead className="text-right text-[#f0f0f2]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {numbers.map((num) => (
                                <TableRow key={num.id} className="border-b-[#e5e7eb] hover:bg-[#e5e7eb]/20">
                                    <TableCell className="font-medium text-[#7c5cfc] flex items-center gap-2">
                                        <PhoneCall className="h-4 w-4 text-[#8b8b9a]" />
                                        {num.phone_number}
                                    </TableCell>
                                    <TableCell className="text-[#f0f0f2] flex items-center gap-1">
                                        <Globe className="h-4 w-4 text-[#8b8b9a]" />
                                        {num.country}
                                    </TableCell>
                                    <TableCell className="capitalize text-[#8b8b9a]">{num.type}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "border-none",
                                            num.status === 'active' 
                                                ? "bg-emerald-500/10 text-emerald-500" 
                                                : "bg-slate-500/10 text-slate-400"
                                        )}>
                                            {num.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[#f0f0f2]">
                                        {num.assigned_agent_name ? (
                                            <Badge className="bg-blue-500/10 text-[#7c5cfc] border-none">{num.assigned_agent_name}</Badge>
                                        ) : (
                                            <span className="text-[#8b8b9a] text-xs">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-[#7c5cfc] hover:bg-[#7c5cfc]/10"
                                                onClick={() => {
                                                    setSelectedNumber(num);
                                                    setIsAssignOpen(true);
                                                }}
                                            >
                                                <Link2 className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleRelease(num.id)}
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
