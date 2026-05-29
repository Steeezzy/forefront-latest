import { buildProxyUrl } from './backend-url';
import type { Template, Industry } from '@/types/template';

/**
 * Fetch all active templates with optional filters
 */
export async function fetchTemplates(filters?: {
    industry_id?: string;
    direction?: string;
    mode?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
}): Promise<Template[]> {
    const params = new URLSearchParams();
    if (filters?.industry_id) params.append('industry_id', filters.industry_id);
    if (filters?.direction) params.append('direction', filters.direction);
    if (filters?.mode) params.append('mode', filters.mode);
    if (filters?.featured !== undefined) params.append('featured', String(filters.featured));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const res = await fetch(buildProxyUrl(`/api/templates?${params.toString()}`));
    if (!res.ok) {
        throw new Error(`Failed to fetch templates: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
}

/**
 * Fetch a single template by ID
 */
export async function fetchTemplate(id: string): Promise<Template> {
    const res = await fetch(buildProxyUrl(`/api/templates/${id}`));
    if (!res.ok) {
        throw new Error(`Failed to fetch template: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
}

/**
 * Fetch all industries (for navigation/filtering)
 */
export async function fetchIndustries(): Promise<Industry[]> {
    const res = await fetch(buildProxyUrl('/api/templates/industries/list'));
    if (!res.ok) {
        throw new Error(`Failed to fetch industries: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
}

/**
 * Fetch featured templates (for homepage)
 */
export async function fetchFeaturedTemplates(limit?: number): Promise<Template[]> {
    const res = await fetch(buildProxyUrl(`/api/templates/featured${limit ? `?limit=${limit}` : ''}`));
    if (!res.ok) {
        throw new Error(`Failed to fetch featured templates: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
}

/**
 * Fetch templates by industry slug
 */
export async function fetchTemplatesByIndustry(industryId: string): Promise<Template[]> {
    const res = await fetch(buildProxyUrl(`/api/templates/industry/${industryId}`));
    if (!res.ok) {
        throw new Error(`Failed to fetch templates for industry: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || [];
}

// ============================================
// Admin API (for internal/seed operations)
// ============================================

/**
 * Seed templates from hardcoded data (one-time)
 */
export async function seedTemplates(templates: any[]): Promise<{ seeded: number }> {
    const res = await fetch(buildProxyUrl('/api/templates/admin/seed'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
    });
    if (!res.ok) {
        throw new Error(`Failed to seed templates: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
}

/**
 * Create a template (admin)
 */
export async function createTemplate(data: Partial<Template>): Promise<Template> {
    const res = await fetch(buildProxyUrl('/api/templates/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error(`Failed to create template: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
}

/**
 * Update a template (admin)
 */
export async function updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
    const res = await fetch(buildProxyUrl(`/api/templates/admin/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error(`Failed to update template: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
}

/**
 * Delete a template (soft)
 */
export async function deleteTemplate(id: string): Promise<boolean> {
    const res = await fetch(buildProxyUrl(`/api/templates/admin/${id}`), {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error(`Failed to delete template: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data?.deleted || false;
}
