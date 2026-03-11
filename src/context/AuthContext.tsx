"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshUser = async () => {
        try {
            // Step 1: Try syncing Clerk session to backend (sets the backend JWT cookie)
            const syncRes = await fetch("/api/auth/sync", { method: "POST" });
            if (syncRes.ok) {
                const syncData = await syncRes.json();
                if (syncData.user) {
                    setUser(syncData.user);
                    setLoading(false);
                    return;
                }
            }

            // Step 2: Fallback — try fetching from backend directly (existing cookie)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data?.user) {
                    setUser(data.user);
                    return;
                }
            }

            // Step 3: Use demo user so dashboards render with mock data
            console.info('[Auth] Using demo user (backend unavailable)');
            setUser({ id: "usr_demo_001", email: "demo@forefront.ai", name: "Sarah Chen" });
        } catch {
            // Fallback to demo user when everything fails
            console.info('[Auth] Using demo user (error)');
            setUser({ id: "usr_demo_001", email: "demo@forefront.ai", name: "Sarah Chen" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (_email: string) => {
        await refreshUser();
        router.push('/panel');
    };

    const logout = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            await fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: 'include' });
        } catch {
            // silent
        }
        setUser(null);
        router.push("/sign-in");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

