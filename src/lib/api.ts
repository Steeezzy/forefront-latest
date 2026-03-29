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

export async function apiFetch<T>(
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

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

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

