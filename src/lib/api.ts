export async function apiFetch(
    path: string,
    options: RequestInit = {}
) {
    // Use the Next.js API proxy to forward requests to the backend
    // This ensures the auth token cookie is properly included
    const url = `/api/proxy${path}`;

    // Add client-side timeout (10s)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            signal: controller.signal,
            credentials: "include", // Essential for HttpOnly cookies
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });
    } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw err;
    }
    clearTimeout(timeout);

    if (response.status === 401) {
        // Throw an error to let components handle auth failure
        throw new Error('UNAUTHORIZED');
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
