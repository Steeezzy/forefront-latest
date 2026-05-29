export const DEFAULT_API_BASE_URL = "https://forefront-latest.onrender.com";

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

export const FALLBACK_API_BASE_URL = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_FALLBACK_API_URL ||
    process.env.FALLBACK_API_BASE_URL ||
    DEFAULT_API_BASE_URL
);

export function isLocalBackendUrl(url: string) {
    try {
        const parsed = new URL(url);
        return (
            parsed.hostname === "localhost" ||
            parsed.hostname === "127.0.0.1" ||
            parsed.hostname === "0.0.0.0"
        );
    } catch {
        return false;
    }
}

export function getBackendCandidates() {
    const candidates = [PUBLIC_API_BASE_URL];

    if (
        isLocalBackendUrl(PUBLIC_API_BASE_URL) &&
        FALLBACK_API_BASE_URL !== PUBLIC_API_BASE_URL
    ) {
        candidates.push(FALLBACK_API_BASE_URL);
    }

    return candidates;
}

export function buildApiUrl(path: string) {
    return `${PUBLIC_API_BASE_URL}${normalizePath(path)}`;
}

export function buildProxyUrl(path: string) {
    return `/api/proxy${normalizePath(path)}`;
}
