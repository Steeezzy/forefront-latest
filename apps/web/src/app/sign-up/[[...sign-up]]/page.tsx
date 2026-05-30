"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect_url") || "/hub";

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5]">
            <SignUp forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
        </div>
    );
}
