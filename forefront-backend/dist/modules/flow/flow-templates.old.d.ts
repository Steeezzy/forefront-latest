/**
 * Flow Templates Library
 * Organized by category: Gather, Nurture, Qualify
 */
export interface FlowTemplate {
    name: string;
    description: string;
    category: 'gather' | 'nurture' | 'qualify' | 'support';
    trigger_type: string;
    is_active: boolean;
    uses?: number;
    nodes: any[];
    edges: any[];
}
export declare const flowTemplates: FlowTemplate[];
export declare function getTemplatesByCategory(category: string): FlowTemplate[];
//# sourceMappingURL=flow-templates.old.d.ts.map