const DEFAULT_API_BASE_URL = "https://forefront-latest.onrender.com";

function normalizeBaseUrl(url: string) {
    return url.replace(/\/+$/, "");
}

function normalizePath(path: string) {
    return path.startsWith("/") ? path : `/${path}`;
}

export const PUBLIC_API_BASE_URL = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    DEFAULT_API_BASE_URL
);

export function buildApiUrl(path: string) {
    return `${PUBLIC_API_BASE_URL}${normalizePath(path)}`;
}

export function buildProxyUrl(path: string) {
    return `/api/proxy${normalizePath(path)}`;
}
