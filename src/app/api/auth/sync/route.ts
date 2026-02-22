import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/sync
 * 
 * Bridges Clerk authentication to the backend.
 * Reads the Clerk session, calls the backend to create/sync the user,
 * and the backend sets the `token` HttpOnly cookie.
 */
export async function POST() {
    try {
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

        // Call the backend sync endpoint
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${backendUrl}/auth/clerk-sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clerkUserId: userId,
                email,
                name,
            }),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
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
        return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 });
    }
}
