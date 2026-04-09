"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") || "/panel";

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#ffffff]">
            <SignIn forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
        </div>
    );
}
