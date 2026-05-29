import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
    getBackendCandidates,
    isLocalBackendUrl,
} from "@/lib/backend-url";

/**
 * Proxy API route that forwards requests to the backend with authentication.
 * This is necessary because browser cookies on the frontend domain cannot be sent
 * directly to the production backend domain.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, params, "GET");
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, params, "POST");
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, params, "PUT");
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, params, "DELETE");
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    return proxyRequest(request, params, "PATCH");
}

async function proxyRequest(
    request: NextRequest,
    paramsPromise: Promise<{ path: string[] }>,
    method: string
) {
    const { path } = await paramsPromise;
    const backendPath = "/" + path.join("/");
    
    // Get query string
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";
    
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    console.log(`[NextProxy] ${method} ${path.join('/')} Token exists: ${!!token}`);
    
    // Build headers
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    
    if (token) {
        headers["Cookie"] = `token=${token}`;
    }
    
    // Build fetch options
    const fetchOptions: RequestInit = {
        method,
        headers,
    };
    
    // Include body for non-GET requests
    if (method !== "GET" && method !== "HEAD") {
        try {
            const body = await request.text();
            if (body) {
                fetchOptions.body = body;
            }
        } catch {
            // No body
        }
    }
    
    const backendCandidates = getBackendCandidates();
    let lastError: any = null;

    for (const backendUrl of backendCandidates) {
        const url = `${backendUrl}${backendPath}${queryString}`;
        const timeoutMs = isLocalBackendUrl(backendUrl) ? 3000 : 60000;

        try {
            console.log(`[NextProxy] Fetching: ${url} (timeout: ${timeoutMs}ms)`);
            const response = await fetch(url, {
                ...fetchOptions,
                signal: AbortSignal.timeout(timeoutMs),
            });

            console.log(`[NextProxy] Response: ${response.status} ${response.statusText}`);

            if (response.status === 204) {
                return new NextResponse(null, { status: 204 });
            }

            const responseText = await response.text();
            console.log(`[NextProxy] Response body preview: ${responseText.substring(0, 200)}`);

            let data: any;
            try {
                data = JSON.parse(responseText);
            } catch {
                console.error(`[NextProxy] Invalid JSON from backend: ${responseText.substring(0, 500)}`);
                return new NextResponse(
                    JSON.stringify({
                        error: "Backend returned non-JSON",
                        details: responseText.substring(0, 500),
                        url,
                    }),
                    {
                        status: 502,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }

            return NextResponse.json(data, { status: response.status });
        } catch (error: any) {
            lastError = error;
            console.error(`[NextProxy] Error for ${url}:`, error);

            const isLastCandidate = backendUrl === backendCandidates[backendCandidates.length - 1];
            if (!isLastCandidate) {
                console.warn(`[NextProxy] Retrying with fallback backend...`);
                continue;
            }
        }
    }

    if (lastError?.name === "AbortError") {
        return NextResponse.json(
            { error: "Request timeout", message: "Backend took too long to respond" },
            { status: 504 }
        );
    }

    return NextResponse.json(
        {
            error: "Backend unavailable",
            message: lastError?.message || "Unable to reach backend",
            attempted: backendCandidates,
        },
        { status: 502 }
    );
}
