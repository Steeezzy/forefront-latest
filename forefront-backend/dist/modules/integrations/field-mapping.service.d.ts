/**
 * FieldMappingService — CRUD for configurable field mappings
 *
 * Lets users map Forefront contact fields to CRM / marketing platform fields.
 * Each integration type has sensible defaults that get created on first connect.
 */
export interface FieldMapping {
    id: string;
    workspace_id: string;
    integration_type: string;
    source_field: string;
    target_field: string;
    target_field_label?: string;
    is_required: boolean;
    is_default: boolean;
    transform: string;
    created_at: string;
    updated_at: string;
}
export interface FieldMappingInput {
    source_field: string;
    target_field: string;
    target_field_label?: string;
    is_required?: boolean;
    transform?: string;
}
export declare const SOURCE_FIELDS: {
    key: string;
    label: string;
    type: string;
}[];
export declare class FieldMappingService {
    /**
     * Get all mappings for a workspace + integration type.
     * If none exist yet, seeds the defaults and returns those.
     */
    getMappings(workspaceId: string, integrationType: string): Promise<FieldMapping[]>;
    /**
     * Save (upsert) a full set of mappings for a workspace + integration.
     * Replaces all non-required mappings with the incoming set.
     */
    saveMappings(workspaceId: string, integrationType: string, mappings: FieldMappingInput[]): Promise<FieldMapping[]>;
    /**
     * Delete a single mapping
     */
    deleteMapping(workspaceId: string, mappingId: string): Promise<void>;
    /**
     * Reset to default mappings
     */
    resetToDefaults(workspaceId: string, integrationType: string): Promise<FieldMapping[]>;
    /**
     * Apply mappings to transform a Forefront contact into CRM-ready data.
     * Used by CrmSyncManager.syncContact() before sending to CRM.
     */
    applyMappings(workspaceId: string, integrationType: string, sourceData: Record<string, any>): Promise<Record<string, any>>;
    /**
     * Get available source fields
     */
    getSourceFields(): {
        key: string;
        label: string;
        type: string;
    }[];
    /**
     * Get default target fields for a given integration type
     */
    getDefaultTargetFields(integrationType: string): FieldMappingInput[];
    private seedDefaults;
}
//# sourceMappingURL=field-mapping.service.d.ts.map