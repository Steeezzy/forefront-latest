"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// 1. VALIDATION SCHEMA
const agentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    tone: z.enum(["professional", "friendly", "humorous", "pirate"]),
    goal: z.string().min(10, "Describe the goal in at least 10 characters"),
    fallback_message: z.string().min(5, "Fallback message is required"),
});

type AgentFormValues = z.infer<typeof agentSchema>;

export function AgentSettings({ agentId, initialData }: { agentId: string; initialData: any }) {
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<AgentFormValues>({
        resolver: zodResolver(agentSchema),
        defaultValues: {
            name: initialData?.name || "Support Bot",
            tone: initialData?.tone || "professional",
            goal: initialData?.goal || "Assist customers with inquiries.",
            fallback_message: initialData?.fallback_message || "I'm not sure, let me check.",
        },
    });

    // 2. THE SAVE HANDLER
    async function onSubmit(data: AgentFormValues) {
        setIsSaving(true);
        try {
            // This hits your backend to update the "Brain"
            await apiFetch(`/agents/${agentId}/config`, {
                method: "PATCH",
                body: JSON.stringify(data),
            });

            toast.success("Agent brain updated successfully!");
        } catch (error) {
            toast.error("Could not update agent.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="grid gap-6">
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                            Agent Personality
                        </CardTitle>
                        <CardDescription>
                            Define how your AI behaves. This controls the "System Prompt".
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* AGENT NAME */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Agent Name</label>
                            <Input {...form.register("name")} placeholder="e.g. Alice" />
                            {form.formState.errors.name && (
                                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        {/* TONE SELECTION */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Tone of Voice</label>
                            <Select
                                onValueChange={(val) => form.setValue("tone", val as any)}
                                defaultValue={form.getValues("tone")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional & Crisp</SelectItem>
                                    <SelectItem value="friendly">Friendly & Casual</SelectItem>
                                    <SelectItem value="humorous">Witty & Humorous</SelectItem>
                                    <SelectItem value="pirate">Pirate (Testing Mode)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* GOAL DEFINITION */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Primary Goal</label>
                            <Textarea
                                {...form.register("goal")}
                                placeholder="e.g. To help users troubleshoot login issues and suggest upgrading to the Pro plan."
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                The AI will prioritize this objective in every conversation.
                            </p>
                        </div>

                        {/* FALLBACK MESSAGE */}
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Fallback Message</label>
                            <Input
                                {...form.register("fallback_message")}
                                placeholder="What to say if it doesn't know?"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating Brain...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Configuration
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
