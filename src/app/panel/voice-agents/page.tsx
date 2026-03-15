"use client";

import { useEffect, useState } from "react";
import { Plus, Phone, Edit, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
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
import { Textarea } from "@/components/ui/textarea";

interface VoiceAgent {
    id: string;
    name: string;
    language: string;
    voice: string;
    system_prompt: string;
    first_message: string;
    status: 'active' | 'inactive';
    call_count: number;
    created_at?: string;
}

export default function VoiceAgentsPage() {
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [language, setLanguage] = useState("English");
    const [voice, setVoice] = useState("Meera");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [firstMessage, setFirstMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const orgId = "test"; // As per request/curl example

    const fetchAgents = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8000/api/voice-agents?orgId=${orgId}`);
            if (!res.ok) throw new Error("Failed to fetch agents");
            const data = await res.json();
            setAgents(data);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`http://localhost:8000/api/voice-agents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    name,
                    language,
                    voice,
                    system_prompt: systemPrompt,
                    first_message: firstMessage,
                    status: "active"
                })
            });

            if (!res.ok) throw new Error("Failed to create agent");
            
            setIsCreateOpen(false);
            // Reset form
            setName("");
            setLanguage("English");
            setVoice("Meera");
            setSystemPrompt("");
            setFirstMessage("");
            
            fetchAgents(); // Refresh
        } catch (err: any) {
            alert(err.message || "Failed to create agent");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this agent?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/voice-agents/${id}?orgId=${orgId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete agent");
            fetchAgents();
        } catch (err: any) {
            alert(err.message || "Failed to delete");
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#f0f0f2]">Voice Agents</h1>
                    <p className="text-sm text-[#8b8b9a] mt-1">Manage your AI voice agents for calling campaigns</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-gray-900 gap-2">
                            <Plus className="h-4 w-4" /> Create Agent
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                        <DialogHeader>
                            <DialogTitle>Create Voice Agent</DialogTitle>
                            <DialogDescription className="text-[#8b8b9a]">
                                Configure a new AI agent for your campaigns.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[#f0f0f2]">Name</Label>
                                <Input 
                                    id="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Sales Agent 1"
                                    className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2] focus-visible:ring-[#7c5cfc]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#f0f0f2]">Language</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Hindi">Hindi</SelectItem>
                                            <SelectItem value="Tamil">Tamil</SelectItem>
                                            <SelectItem value="Malayalam">Malayalam</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#f0f0f2]">Voice</Label>
                                    <Select value={voice} onValueChange={setVoice}>
                                        <SelectTrigger className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                            <SelectValue placeholder="Select voice" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                                            <SelectItem value="Meera">Meera (Fem.)</SelectItem>
                                            <SelectItem value="Priya">Priya (Fem.)</SelectItem>
                                            <SelectItem value="Aria">Aria (Fem.)</SelectItem>
                                            <SelectItem value="Marcus">Marcus (Male)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="prompt" className="text-[#f0f0f2]">System Prompt</Label>
                                <Textarea 
                                    id="prompt" 
                                    value={systemPrompt} 
                                    onChange={(e) => setSystemPrompt(e.target.value)} 
                                    placeholder="You are a helpful sales assistant..."
                                    className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2] min-h-[100px] focus-visible:ring-[#7c5cfc]"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="first_message" className="text-[#f0f0f2]">First Message</Label>
                                <Input 
                                    id="first_message" 
                                    value={firstMessage} 
                                    onChange={(e) => setFirstMessage(e.target.value)} 
                                    placeholder="Hello, I am calling from..."
                                    className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2] focus-visible:ring-[#7c5cfc]"
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <Button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="bg-[#7c5cfc] hover:bg-[#7c5cfc]/90 text-gray-900 w-full"
                                >
                                    {submitting ? <Spinner className="h-4 w-4 mr-2" /> : null}
                                    Create Agent
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
            ) : agents.length === 0 ? (
                <Empty className="border-[#e5e7eb] bg-[#ffffff]/50">
                    <EmptyHeader>
                        <EmptyTitle>No Voice Agents</EmptyTitle>
                        <EmptyDescription>Create your first voice agent to start making calls.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <Card key={agent.id} className="bg-[#ffffff] border-[#e5e7eb] text-[#f0f0f2]">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle className="text-lg font-bold">{agent.name}</CardTitle>
                                    <CardDescription className="text-[#8b8b9a]">{agent.voice} ({agent.language})</CardDescription>
                                </div>
                                <Badge className={cn(
                                    "capitalize",
                                    agent.status === "active" 
                                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10" 
                                        : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/10"
                                )}>
                                    {agent.status}
                                </Badge>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="text-sm text-[#8b8b9a] line-clamp-2">
                                    "{agent.system_prompt}"
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm text-[#f0f0f2]">
                                    <Phone className="h-4 w-4 text-[#7c5cfc]" />
                                    <span>Calls: {agent.call_count || 0}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 border-t border-[#e5e7eb] pt-4">
                                <Button size="sm" variant="ghost" className="text-[#8b8b9a] hover:text-[#f0f0f2] hover:bg-[#e5e7eb]">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleDelete(agent.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" className="bg-[#7c5cfc]/10 hover:bg-[#7c5cfc]/20 text-[#7c5cfc] gap-1">
                                    <Play className="h-3.5 w-3.5" /> Test
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
