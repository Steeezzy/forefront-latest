const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ShopifyStore {
  id: string;
  shop_domain: string;
  description?: string;
  is_active: boolean;
  installed_at: string;
  updated_at: string;
  last_synced_at?: string;
  plan_name?: string;
  scopes?: string;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const isClient = typeof window !== "undefined";
  let finalUrl = endpoint;

  // Intelligent routing:
  // 1. If we're in the browser and this is a backend call,
  //    we MUST use the local proxy to include HttpOnly session cookies.
  //    We proxy everything except known local mock routes (starting with /api/industries or /api/templates).
  const isLocalMock = endpoint.startsWith("/api/industries") || endpoint.startsWith("/api/templates");
  
  if (isClient && !isLocalMock && (endpoint.startsWith("/api/") || !endpoint.startsWith("/api/"))) {
    // If it's a client call and NOT a known mock, proxy it.
    // This handles both "/billing/status" and "/api/shopify/stores"
    finalUrl = `/api/proxy${endpoint}`;
  } else if (!isClient) {
    // 2. If we're on the server (RSC/Actions), use the full backend URL directly.
    finalUrl = `${API_URL}${endpoint}`;
  }

  const res = await fetch(finalUrl, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 204) {
    return null as T;
  }

  const responseText = await res.text();
  let responseBody: any = null;

  if (responseText) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
  }

  if (!res.ok) {
    const errorMessageFromBody =
      typeof responseBody === "object" && responseBody !== null
        ? responseBody.error || responseBody.message || responseBody.details || responseBody?.error?.message
        : typeof responseBody === "string"
          ? responseBody
          : "";

    const normalizedMessage = errorMessageFromBody || res.statusText || "Request failed";
    throw new Error(`API Error: ${res.status} ${normalizedMessage}`);
  }

  return responseBody as T;
}

export interface Integration {
  id: string;
  integration_type?: string;
  type?: string;
  status: string;
  display_name?: string;
  error_message?: string | null;
  last_synced_at?: string | null;
  config?: Record<string, unknown>;
}

export interface SyncLog {
  id: string;
  sync_type?: string;
  direction?: string;
  status: "running" | "completed" | "failed" | string;
  records_synced: number;
  records_failed: number;
  error_message?: string | null;
  started_at: string;
}

export const integrationsApi = {
  list: () => apiFetch<{ success: boolean; integrations: Integration[] }>("/api/integrations"),
  get: (type: string) =>
    apiFetch<{ success: boolean; integration: Integration | null; connected: boolean }>(
      `/api/integrations/${type}`
    ),
  connect: (type: string, payload: Record<string, unknown>) =>
    apiFetch(`/api/integrations/${type}/connect`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  disconnect: (type: string) =>
    apiFetch(`/api/integrations/${type}/disconnect`, {
      method: "DELETE",
    }),
  updateConfig: (type: string, config: Record<string, unknown>) =>
    apiFetch(`/api/integrations/${type}/config`, {
      method: "PUT",
      body: JSON.stringify({ config }),
    }),
  test: (type: string) =>
    apiFetch<{ success: boolean; result: { success: boolean; error?: string } }>(
      `/api/integrations/${type}/test`,
      {
        method: "POST",
      }
    ),
  getSyncLogs: (type: string) =>
    apiFetch<{ success: boolean; logs: SyncLog[] }>(`/api/integrations/${type}/sync-logs`),
};

export const oauthApi = {
  authorize: (type: string, redirectUri?: string) =>
    apiFetch<{ success: boolean; authorizeUrl: string; state: string }>(
      `/api/integrations/oauth/${type}/authorize`,
      {
        method: "POST",
        body: JSON.stringify(redirectUri ? { redirectUri } : {}),
      }
    ),
};

export const crmApi = {
  syncContact: (type: string, payload: Record<string, unknown>) =>
    apiFetch(`/api/integrations/crm/${type}/sync-contact`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getSyncedContacts: (type: string, page = 1, limit = 25) =>
    apiFetch<{ success: boolean; contacts: unknown[]; total: number }>(
      `/api/integrations/crm/${type}/synced-contacts?page=${page}&limit=${limit}`
    ),
};

export const marketingApi = {
  getLists: (type: string) =>
    apiFetch<{ success: boolean; lists: unknown[] }>(`/api/integrations/marketing/${type}/lists`),
  getSubscribers: (type: string, page = 1, limit = 25) =>
    apiFetch<{ success: boolean; subscribers: unknown[]; total: number }>(
      `/api/integrations/marketing/${type}/subscribers?page=${page}&limit=${limit}`
    ),
  subscribe: (type: string, listId: string, subscriber: Record<string, unknown>) =>
    apiFetch(`/api/integrations/marketing/${type}/subscribe`, {
      method: "POST",
      body: JSON.stringify({ listId, subscriber }),
    }),
};

export const shopifyApi = {
  getStores: () => apiFetch<{ success: boolean; stores: ShopifyStore[] }>("/api/shopify/stores"),
  triggerSync: (storeId: string) => apiFetch("/api/shopify/sync", {
    method: "POST",
    body: JSON.stringify({ storeId })
  }),
  disconnect: (storeId: string) => apiFetch("/api/shopify/disconnect", {
    method: "POST",
    body: JSON.stringify({ storeId })
  }),
};

export interface CoreCustomerInput {
  workspace_id: string;
  name?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  lead_score?: number;
  lifecycle_stage?: string;
}

export interface CoreAppointmentInput {
  workspace_id: string;
  customer_id?: string;
  service: string;
  date: string;
  notes?: string;
  status?: string;
}

export interface CoreOrchestratorInput {
  workspace_id: string;
  message: string;
  channel?: "voice" | "chat" | "whatsapp";
  customer_id?: string;
  customer_phone?: string;
  customer_name?: string;
  context?: Record<string, any>;
  ai_output?: {
    intent: string;
    entities?: Record<string, any>;
  };
}

export const coreApi = {
  createCustomer: (payload: CoreCustomerInput) =>
    apiFetch<{ success: boolean; data: any }>("/api/core/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getCustomerByPhone: (workspaceId: string, phone: string) =>
    apiFetch<{ success: boolean; data: any }>(
      `/api/core/customers/phone/${encodeURIComponent(phone)}?workspace_id=${encodeURIComponent(workspaceId)}`
    ),

  logInteraction: (payload: {
    workspace_id: string;
    customer_id?: string;
    channel: string;
    message?: string;
    response?: string;
    intent?: string;
    metadata?: Record<string, any>;
  }) =>
    apiFetch<{ success: boolean; data: any }>("/api/core/customers/interactions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAppointmentAvailability: (workspaceId: string, date: string) =>
    apiFetch<{ success: boolean; data: { available: boolean } }>(
      `/api/core/appointments/availability?workspace_id=${encodeURIComponent(workspaceId)}&date=${encodeURIComponent(date)}`
    ),

  createAppointment: (payload: CoreAppointmentInput) =>
    apiFetch<{ success: boolean; data: any }>("/api/core/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listAppointments: (workspaceId: string, limit = 50) =>
    apiFetch<{ success: boolean; data: any[] }>(
      `/api/core/appointments?workspace_id=${encodeURIComponent(workspaceId)}&limit=${limit}`
    ),

  executeOrchestratorTurn: (payload: CoreOrchestratorInput) =>
    apiFetch<{ success: boolean; data: any }>("/api/orchestrator/core/execute", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};




export const api = {
  // Industries
  getIndustries: (filters?: Record<string, string>) => {
    const params = filters ? "?" + new URLSearchParams(filters).toString() : "";
    return apiFetch(`/api/industries${params}`);
  },
  getIndustry: (id: string) => apiFetch(`/api/industries/${id}`),

  // Templates
  getTemplates: (filters?: Record<string, string>) => {
    const params = filters ? "?" + new URLSearchParams(filters).toString() : "";
    return apiFetch(`/api/templates${params}`);
  },
  getTemplate: (id: string) => apiFetch(`/api/templates/${id}`),

  // Workspaces
  getWorkspaces: () => apiFetch("/api/workspaces"),
  getWorkspace: (id: string) => apiFetch(`/api/workspaces/${id}`),
  createWorkspace: (data: { industryId: string; name: string }) =>
    apiFetch("/api/workspaces", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateWorkspace: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/api/workspaces/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Calls
  getWorkspaceCalls: (id: string, filters?: Record<string, string>) => {
    const params = filters ? "?" + new URLSearchParams(filters).toString() : "";
    return apiFetch(`/api/workspaces/${id}/calls${params}`);
  },

  // Analytics
  getWorkspaceAnalytics: (id: string) =>
    apiFetch(`/api/workspaces/${id}/analytics`),

  // Backend bridge
  healthCheck: () => apiFetch("/api/backend/health"),
  sendChat: (workspaceId: string, message: string) =>
    apiFetch("/api/backend/chat", {
      method: "POST",
      body: JSON.stringify({ workspace_id: workspaceId, message }),
    }),
  initiateCall: (workspaceId: string, phone: string) =>
    apiFetch("/api/backend/call", {
      method: "POST",
      body: JSON.stringify({ workspace_id: workspaceId, phone }),
    }),
  scrapeWebsite: (url: string) =>
    apiFetch("/api/backend/scrape", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
};

