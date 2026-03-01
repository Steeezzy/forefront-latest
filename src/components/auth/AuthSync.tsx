"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

/**
 * Component that syncs Clerk authentication with the backend.
 * Ensures the backend JWT cookie is set whenever the user is authenticated with Clerk.
 */
export function AuthSync() {
    const { isSignedIn, isLoaded } = useAuth();
    const syncedRef = useRef(false);

    useEffect(() => {
        async function syncWithBackend() {
            if (!isLoaded || !isSignedIn || syncedRef.current) return;
            
            try {
                const res = await fetch("/api/auth/sync", { method: "POST" });
                if (res.ok) {
                    syncedRef.current = true;
                }
            } catch (error) {
                console.error("Failed to sync auth with backend:", error);
            }
        }

        syncWithBackend();
    }, [isLoaded, isSignedIn]);

    return null;
}
