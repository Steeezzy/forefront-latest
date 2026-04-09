import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
    getBackendCandidates,
    isLocalBackendUrl,
} from "@/lib/backend-url";

/**
 * POST /api/auth/sync
 * 
 * Bridges Clerk authentication to the backend.
 * Reads the Clerk session, calls the backend to create/sync the user,
 * and the backend sets the `token` HttpOnly cookie.
 */
export async function POST() {
    try {
        if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
            return NextResponse.json({ error: "Clerk is not configured" }, { status: 503 });
        }

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const email = user.emailAddresses[0]?.emailAddress;
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || email;

        const requestBody = JSON.stringify({
            clerkUserId: userId,
            email,
            name,
        });
        const backendCandidates = getBackendCandidates();
        let res: Response | null = null;
        let lastError: any = null;

        for (const backendUrl of backendCandidates) {
            const syncController = new AbortController();
            const timeoutMs = isLocalBackendUrl(backendUrl) ? 3000 : 30000;
            const syncTimeout = setTimeout(() => syncController.abort(), timeoutMs);

            try {
                res = await fetch(`${backendUrl}/auth/clerk-sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: requestBody,
                    signal: syncController.signal,
                });
                clearTimeout(syncTimeout);
                break;
            } catch (err: any) {
                clearTimeout(syncTimeout);
                lastError = err;

                const isLastCandidate =
                    backendUrl === backendCandidates[backendCandidates.length - 1];
                if (!isLastCandidate) {
                    continue;
                }

                if (err.name === "AbortError") {
                    return NextResponse.json({ error: "Backend sync timed out" }, { status: 504 });
                }
            }
        }

        if (!res) {
            return NextResponse.json(
                {
                    error: "Backend sync unavailable",
                    message: lastError?.message || "Unable to reach backend",
                },
                { status: 502 }
            );
        }

        if (!res.ok) {
            const errText = await res.text();
            let errData: { message?: string } = {};
            try {
                errData = errText ? JSON.parse(errText) : {};
            } catch {
                errData = { message: errText || "Backend sync failed" };
            }
            return NextResponse.json(
                { error: errData.message || "Backend sync failed" },
                { status: res.status }
            );
        }

        const data = await res.json();

        // Set the backend JWT as an HttpOnly cookie on the frontend domain
        const response = NextResponse.json({ success: true, user: data.user, workspace: data.workspace });
        response.cookies.set("token", data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
    } catch (error: any) {
        console.error("Auth sync error:", error);
        const message = error?.message || "Sync failed";
        if (message.includes("clerkMiddleware")) {
            return NextResponse.json(
                { error: "Authentication middleware unavailable" },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
