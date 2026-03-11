export declare class KnowledgeService {
    addSource(workspaceId: string, agentId: string, type: 'text' | 'url' | 'pdf' | 'qa_pair', content: string): Promise<{
        sourceId: any;
        chunks: number;
        message: string;
    } | {
        sourceId: any;
        chunks: number;
        message?: undefined;
    }>;
    getSources(agentId: string): Promise<any[]>;
}
//# sourceMappingURL=knowledge.service.d.ts.map