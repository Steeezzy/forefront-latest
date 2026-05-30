import { buildProxyUrl } from "@/lib/backend-url";

export interface WorkspaceSession {
    workspaceId: string;
    agentId?: string;
}

export async function resolveWorkspaceSession(): Promise<WorkspaceSession> {
    const response = await fetch(buildProxyUrl("/agents/primary"));
    if (!response.ok) {
        throw new Error("Failed to resolve workspace session");
    }

    const data = await response.json();
    return {
        workspaceId: data.workspace_id,
        agentId: data.id,
    };
}
