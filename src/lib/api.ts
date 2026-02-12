export async function apiFetch(
    path: string,
    options: RequestInit = {}
) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
        ...options,
        credentials: "include", // Essential for HttpOnly cookies
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    if (response.status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = "/login";
        }
        return;
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || "API Error");
    }

    return data;
}
