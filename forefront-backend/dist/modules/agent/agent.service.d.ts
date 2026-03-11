export declare class AgentService {
    updateConfig(workspaceId: string, agentId: string, data: {
        name?: string;
        tone?: string;
        goal?: string;
        first_message?: string;
        fallback_message?: string;
        is_active?: boolean;
    }): Promise<any>;
    getAgent(workspaceId: string, agentId: string): Promise<any>;
    ensureAgent(workspaceId: string): Promise<any>;
}
//# sourceMappingURL=agent.service.d.ts.map