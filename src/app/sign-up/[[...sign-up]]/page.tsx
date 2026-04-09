"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") || "/panel";

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#ffffff]">
            <SignUp forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
        </div>
    );
}
