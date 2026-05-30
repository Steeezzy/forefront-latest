"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function OnboardingCheck() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip check if already on onboarding page to prevent loops
        if (pathname === "/panel/onboarding") return;

        // Note: we're doing a simple localStorage check for the first iteration.
        // A more robust check would involve querying the backend for workspace setup status.
        const onboardingComplete = localStorage.getItem("onboarding_complete");
        
        if (!onboardingComplete) {
            router.push("/panel/onboarding");
        }
    }, [pathname, router]);

    return null;
}
