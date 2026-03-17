"use client";

import { useEffect, useState } from "react";
import { Plus, Play, Pause, Eye, Upload, Calendar } from "lucide-react";
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
import { buildProxyUrl } from "@/lib/backend-url";

interface Campaign {
    id: string;
    name: string;
    agent_id: string;
    agent_name?: string;
    status: 'draft' | 'running' | 'completed' | 'failed';
    total_contacts: number;
    called_count: number;
    answered_count: number;
    scheduled_at?: string;
}

interface VoiceAgent {
    id: string;
    name: string;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [selectedAgent, setSelectedAgent] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [scheduleTime, setScheduleTime] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const orgId = "test";

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch campaigns
            const campRes = await fetch(buildProxyUrl(`/api/campaigns?orgId=${orgId}`));
            if (!campRes.ok) throw new Error("Failed to fetch campaigns");
            const campData = await campRes.json();
            setCampaigns(campData);

            // Fetch agents for the dropdown
            const agentRes = await fetch(buildProxyUrl(`/api/voice-agents?orgId=${orgId}`));
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // In a real app, use FormData for file uploads
            // For this layout, we'll simulate or send metadata
            const res = await fetch(buildProxyUrl("/api/campaigns"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    name,
                    voiceAgentId: selectedAgent,
                    type: "voice",
                    scheduledAt: scheduleTime || null
                })
            });

            if (!res.ok) throw new Error("Failed to create campaign");
            
            setIsCreateOpen(false);
            // Reset form
            setName("");
            setSelectedAgent("");
            setCsvFile(null);
            setScheduleTime("");
            
            fetchData(); // Refresh
        } catch (err: any) {
            alert(err.message || "Failed to create campaign");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        if (status !== 'running') {
            alert("Pausing campaigns is not supported by the current backend yet.");
            return;
        }

        try {
            const res = await fetch(buildProxyUrl(`/api/campaigns/${id}/launch`), {
                method: "POST"
            });
            if (!res.ok) throw new Error("Failed to update status");
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running':
                return <Badge className="bg-blue-500/10 text-[#7c5cfc] hover:bg-blue-500/10 border-none">Running</Badge>;
            case 'completed':
                return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-none">Completed</Badge>;
            case 'failed':
                return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/10 border-none">Failed</Badge>;
            default:
                return <Badge className="bg-slate-500/10 text-slate-400 hover:bg-slate-500/10 border-none">Draft</Badge>;
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#f0f0f2]">Campaigns</h1>
                    <p className="text-sm text-[#8b8b9a] mt-1">Run and monitor automated calling campaigns</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-gray-900 gap-2">
                            <Plus className="h-4 w-4" /> New Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                        <DialogHeader>
                            <DialogTitle>New Campaign</DialogTitle>
                            <DialogDescription className="text-[#8b8b9a]">
                                Set up a automated call campaign with an AI agent.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[#f0f0f2]">Campaign Name</Label>
                                <Input 
                                    id="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Q1 Sales Push"
                                    className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#f0f0f2]">Voice Agent</Label>
                                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                    <SelectTrigger className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                        <SelectValue placeholder="Select an agent" />
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

                            <div className="space-y-2">
                                <Label htmlFor="file" className="text-[#f0f0f2]">Upload Contacts (CSV)</Label>
                                <div className="border-2 border-dashed border-[#e5e7eb] rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors cursor-pointer bg-[#ffffff]">
                                    <input 
                                        type="file" 
                                        id="file" 
                                        accept=".csv" 
                                        className="hidden" 
                                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                    />
                                    <Label htmlFor="file" className="cursor-pointer flex flex-col items-center gap-2">
                                        <Upload className="h-8 w-8 text-[#8b8b9a]" />
                                        <span className="text-sm font-medium">
                                            {csvFile ? csvFile.name : "Click to upload CSV"}
                                        </span>
                                        <span className="text-xs text-[#8b8b9a]">
                                            Must include phone numbers
                                        </span>
                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="schedule" className="text-[#f0f0f2]">Schedule Datetime</Label>
                                <div className="relative">
                                    <Input 
                                        id="schedule" 
                                        type="datetime-local" 
                                        value={scheduleTime} 
                                        onChange={(e) => setScheduleTime(e.target.value)} 
                                        className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2] [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button 
                                    type="submit" 
                                    disabled={submitting || !csvFile || !selectedAgent}
                                    className="bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-gray-900 w-full"
                                >
                                    {submitting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                                    Create Campaign
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
            ) : campaigns.length === 0 ? (
                <Empty className="border-[#e5e7eb] bg-[#ffffff]/50">
                    <EmptyHeader>
                        <EmptyTitle>No Campaigns</EmptyTitle>
                        <EmptyDescription>Launch your first voice agent campaign.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="bg-[#ffffff] rounded-xl border border-[#e5e7eb] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-[#ffffff]">
                            <TableRow className="border-b-[#e5e7eb] hover:bg-transparent">
                                <TableHead className="text-[#f0f0f2]">Name</TableHead>
                                <TableHead className="text-[#f0f0f2]">Agent</TableHead>
                                <TableHead className="text-[#f0f0f2]">Status</TableHead>
                                <TableHead className="text-[#f0f0f2]">Contacts</TableHead>
                                <TableHead className="text-[#f0f0f2]">Called</TableHead>
                                <TableHead className="text-[#f0f0f2]">Answered</TableHead>
                                <TableHead className="text-right text-[#f0f0f2]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((camp) => (
                                <TableRow key={camp.id} className="border-b-[#e5e7eb] hover:bg-[#e5e7eb]/20">
                                    <TableCell className="font-medium text-[#f0f0f2]">{camp.name}</TableCell>
                                    <TableCell className="text-[#8b8b9a]">{camp.agent_name || "Agent"}</TableCell>
                                    <TableCell>{getStatusBadge(camp.status)}</TableCell>
                                    <TableCell className="text-[#f0f0f2] font-mono">{camp.total_contacts || 0}</TableCell>
                                    <TableCell className="text-[#f0f0f2] font-mono">{camp.called_count || 0}</TableCell>
                                    <TableCell className="text-emerald-500 font-mono">{camp.answered_count || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {camp.status === 'draft' && (
                                                <Button size="sm" variant="ghost" className="text-green-500 hover:bg-green-500/10" onClick={() => handleStatusChange(camp.id, 'running')}>
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {camp.status === 'running' && (
                                                <Button size="sm" variant="ghost" className="text-amber-500 hover:bg-amber-500/10" onClick={() => handleStatusChange(camp.id, 'draft')}>
                                                    <Pause className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="text-[#8b8b9a] hover:text-[#f0f0f2]">
                                                <Eye className="h-4 w-4" />
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
