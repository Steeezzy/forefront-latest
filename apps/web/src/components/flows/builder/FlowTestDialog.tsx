"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, RefreshCw, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

interface FlowTestDialogProps {
    open: boolean;
    onClose: () => void;
    flowId: string;
    flowName?: string;
    agentId?: string | null;
    onBeforeRun?: () => Promise<boolean | void>;
}

const DEFAULT_TRIGGER_JSON = `{
  "message_text": "I need help with pricing",
  "current_url": "/pricing",
  "browser": "chrome",
  "os": "macos",
  "device_type": "desktop",
  "language": "en",
  "is_returning": false
}`;

const DEFAULT_RESUME_JSON = `{
  "message_text": "Yes"
}`;

export function FlowTestDialog({
    open,
    onClose,
    flowId,
    flowName,
    agentId,
    onBeforeRun,
}: FlowTestDialogProps) {
    const [triggerJson, setTriggerJson] = useState(DEFAULT_TRIGGER_JSON);
    const [resumeJson, setResumeJson] = useState(DEFAULT_RESUME_JSON);
    const [textResponse, setTextResponse] = useState("");
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [execution, setExecution] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setError(null);
    }, [open]);

    const flowState = execution?.final_variables?.__flow_state || {};
    const waitFor = flowState.wait_for as string | undefined;
    const expectedVariable = execution?.final_variables?.expected_response_variable || "response";
    const decisionPayload = execution?.final_variables?.decision_payload || {};
    const decisionOptions = useMemo(() => {
        if (Array.isArray(decisionPayload.options)) {
            return decisionPayload.options.map((option: any) => {
                if (typeof option === "string") {
                    return { label: option, value: option };
                }
                return {
                    label: option.label || option.title || option.value || "Option",
                    value: option.value || option.label || option.title || "option",
                };
            });
        }

        if (Array.isArray(decisionPayload.cards)) {
            return decisionPayload.cards
                .map((card: any) => ({
                    label: card.button || card.title || "Card option",
                    value: card.button || card.title || "card_option",
                }))
                .filter((option: { label: string; value: string }) => option.label);
        }

        return [];
    }, [decisionPayload]);
    const formFields = Array.isArray(execution?.final_variables?.form_request)
        ? execution.final_variables.form_request
        : [];

    const resetSession = () => {
        setExecution(null);
        setError(null);
        setTextResponse("");
        setFormValues({});
        setResumeJson(DEFAULT_RESUME_JSON);
    };

    const handleRun = async () => {
        if (!agentId) {
            setError("Flow agent is still loading. Wait a moment and try again.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const shouldContinue = await onBeforeRun?.();
            if (shouldContinue === false) {
                setError("Save failed. Fix the flow and try again.");
                return;
            }

            let payload: Record<string, any>;
            try {
                payload = JSON.parse(triggerJson);
            } catch {
                setError("Trigger payload must be valid JSON.");
                return;
            }
            const response = await apiFetch(`/api/flows/${flowId}/test`, {
                method: "POST",
                body: JSON.stringify({
                    agent_id: agentId,
                    trigger_data: payload,
                }),
            });

            setExecution(response?.execution || null);
            setTextResponse("");
            setFormValues({});
            setResumeJson(DEFAULT_RESUME_JSON);
        } catch (err: any) {
            setError(err.message || "Failed to run flow test");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResume = async (input: Record<string, any>) => {
        if (!execution?.execution_id) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await apiFetch(`/api/flows/executions/${execution.execution_id}/resume`, {
                method: "POST",
                body: JSON.stringify({
                    agent_id: agentId,
                    input,
                }),
            });

            setExecution(response?.execution || null);
            setTextResponse("");
            setFormValues({});
            setResumeJson(DEFAULT_RESUME_JSON);
        } catch (err: any) {
            setError(err.message || "Failed to resume flow execution");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTextResume = async () => {
        const value = textResponse.trim();
        if (!value) return;

        await handleResume({
            [expectedVariable]: value,
            user_response: value,
            message_text: value,
        });
    };

    const handleFormResume = async () => {
        const payload: Record<string, any> = {};

        for (const field of formFields) {
            const fieldKey = field.variable || field.key || field.name || field.label;
            const fieldValue = formValues[fieldKey] || "";
            if (field.required && !fieldValue.trim()) {
                setError(`"${field.label || fieldKey}" is required.`);
                return;
            }
            payload[fieldKey] = fieldValue;
        }

        await handleResume({
            ...payload,
            form_submission: payload,
        });
    };

    const handleAdvancedResume = async () => {
        try {
            const payload = JSON.parse(resumeJson);
            await handleResume(payload);
        } catch {
            setError("Resume input must be valid JSON.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="max-w-6xl bg-[#ffffff] border-gray-200 text-gray-900 p-0 overflow-hidden">
                <div className="flex h-[85vh] min-h-[620px] overflow-hidden">
                    <div className="w-[360px] shrink-0 border-r border-gray-200 bg-[#f8fafc] flex flex-col">
                        <DialogHeader className="px-6 py-5 border-b border-gray-200">
                            <DialogTitle className="text-xl text-gray-900">Flow Tester</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Run and resume {flowName || "this flow"} against real flow execution logic.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-6 space-y-5 overflow-y-auto">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
                                    Trigger Payload
                                </div>
                                <Textarea
                                    value={triggerJson}
                                    onChange={(event) => setTriggerJson(event.target.value)}
                                    className="min-h-[220px] font-mono text-xs bg-[#ffffff] border-gray-200"
                                />
                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    Include any variables your trigger or condition nodes expect, like
                                    {" "}
                                    <code>message_text</code>, <code>current_url</code>, <code>cart_total</code>,
                                    {" "}
                                    or <code>event_name</code>.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-gray-900"
                                    onClick={handleRun}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                    Run Flow
                                </Button>
                                <Button variant="outline" onClick={resetSession} disabled={isSubmitting}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </div>

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {execution && (
                                <div className="rounded-xl border border-gray-200 bg-[#ffffff] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                Execution
                                            </div>
                                            <div className="mt-1 text-sm font-medium text-gray-900">
                                                {execution.execution_id}
                                            </div>
                                        </div>
                                        <div
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                execution.status === "completed"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : execution.status === "waiting"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {execution.status}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-0 flex-1 min-h-0">
                            <div className="border-r border-gray-200 min-h-0 flex flex-col">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="text-sm font-semibold text-gray-900">Execution Output</div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Review node results, pauses, and runtime variables.
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                                    {!execution && (
                                        <div className="rounded-xl border border-dashed border-gray-300 bg-[#f8fafc] px-6 py-12 text-center text-sm text-slate-500">
                                            Run the flow to inspect node-by-node execution.
                                        </div>
                                    )}

                                    {execution && (
                                        <>
                                            {execution.status === "waiting" && (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
                                                    <div className="flex items-center gap-2 text-amber-800">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span className="text-sm font-semibold">Flow paused for visitor input</span>
                                                    </div>

                                                    {execution.final_variables?.pending_question && (
                                                        <div className="rounded-lg bg-[#ffffff] border border-amber-200 px-3 py-2 text-sm text-gray-900">
                                                            {execution.final_variables.pending_question}
                                                        </div>
                                                    )}

                                                    {waitFor === "input" && (
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-medium text-slate-700">
                                                                Resume as <code>{expectedVariable}</code>
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={textResponse}
                                                                    onChange={(event) => setTextResponse(event.target.value)}
                                                                    placeholder="Type the visitor reply"
                                                                    className="bg-[#ffffff] border-gray-200"
                                                                />
                                                                <Button onClick={handleTextResume} disabled={isSubmitting || !textResponse.trim()}>
                                                                    <ArrowRight className="mr-2 h-4 w-4" />
                                                                    Continue
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {waitFor === "button_click" && (
                                                        <div className="space-y-2">
                                                            {decisionPayload.question && (
                                                                <div className="text-sm font-medium text-gray-900">{decisionPayload.question}</div>
                                                            )}
                                                            <div className="flex flex-wrap gap-2">
                                                                {decisionOptions.map((option: { label: string; value: string }) => (
                                                                    <Button
                                                                        key={`${option.label}-${option.value}`}
                                                                        type="button"
                                                                        variant="outline"
                                                                        className="border-gray-300 bg-[#ffffff]"
                                                                        onClick={() => handleResume({
                                                                            selected_option: option.value,
                                                                            button_selection: option.value,
                                                                            message_text: option.label,
                                                                        })}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        {option.label}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {waitFor === "form_submission" && (
                                                        <div className="space-y-3">
                                                            {formFields.map((field: any) => {
                                                                const fieldKey = field.variable || field.key || field.name || field.label;
                                                                return (
                                                                    <div key={fieldKey}>
                                                                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                                            {field.label || fieldKey}
                                                                        </label>
                                                                        <Input
                                                                            value={formValues[fieldKey] || ""}
                                                                            onChange={(event) => setFormValues((current) => ({
                                                                                ...current,
                                                                                [fieldKey]: event.target.value,
                                                                            }))}
                                                                            placeholder={field.placeholder || field.type || "Value"}
                                                                            className="bg-[#ffffff] border-gray-200"
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                            <Button onClick={handleFormResume} disabled={isSubmitting}>
                                                                <ArrowRight className="mr-2 h-4 w-4" />
                                                                Submit form
                                                            </Button>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                            Advanced resume payload
                                                        </label>
                                                        <Textarea
                                                            value={resumeJson}
                                                            onChange={(event) => setResumeJson(event.target.value)}
                                                            className="min-h-[120px] font-mono text-xs bg-[#ffffff] border-gray-200"
                                                        />
                                                        <div className="mt-2">
                                                            <Button variant="outline" onClick={handleAdvancedResume} disabled={isSubmitting}>
                                                                Resume with JSON
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                    Node Trace
                                                </div>
                                                <div className="space-y-3">
                                                    {(execution.node_trace || []).map((trace: any) => (
                                                        <div key={`${trace.node_id}-${trace.subtype}`} className="rounded-xl border border-gray-200 bg-[#ffffff] p-4">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="text-sm font-semibold text-gray-900">{trace.node_label}</div>
                                                                    <div className="mt-1 text-xs text-slate-500">{trace.subtype}</div>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span className="text-slate-500">{trace.duration_ms || 0}ms</span>
                                                                    <span
                                                                        className={`rounded-full px-2 py-0.5 font-semibold ${
                                                                            trace.status === "success"
                                                                                ? "bg-emerald-100 text-emerald-700"
                                                                                : "bg-red-100 text-red-700"
                                                                        }`}
                                                                    >
                                                                        {trace.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {trace.error && (
                                                                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                                                    {trace.error}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="min-h-0 flex flex-col">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="text-sm font-semibold text-gray-900">Final Variables</div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Inspect the execution state that your downstream nodes receive.
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-5">
                                    {execution ? (
                                        <pre className="rounded-xl border border-gray-200 bg-[#f8fafc] p-4 text-xs leading-6 text-slate-700 overflow-auto whitespace-pre-wrap break-words">
                                            {JSON.stringify(execution.final_variables || {}, null, 2)}
                                        </pre>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-gray-300 bg-[#f8fafc] px-6 py-12 text-center text-sm text-slate-500">
                                            Flow variables will appear here after execution.
                                        </div>
                                    )}

                                    {execution?.status === "completed" && (
                                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Flow completed successfully.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
