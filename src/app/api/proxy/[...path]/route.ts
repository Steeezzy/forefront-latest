import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Proxy API route that forwards requests to the backend with authentication.
 * This is necessary because cookies set on localhost:3000 cannot be sent 
 * directly to localhost:3001 due to cross-origin restrictions.
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
    
    const url = `${BACKEND_URL}${backendPath}${queryString}`;
    
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    // Build headers
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    
    if (token) {
        // Send token as cookie header to backend
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
    
    try {
        // Add AbortController with 8 second timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
        clearTimeout(timeout);
        
        // Handle no-content responses
        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }
        
        const data = await response.json().catch(() => ({}));
        
        // Return the response with the same status
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json(
                { error: "Request timeout", message: "Backend took too long to respond" },
                { status: 504 }
            );
        }
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: "Backend unavailable", message: error.message },
            { status: 502 }
        );
    }
}
