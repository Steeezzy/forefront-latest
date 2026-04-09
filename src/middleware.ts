import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/panel(.*)"]);
const clerkEnabled = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

function shouldBypassClerk(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    return pathname.startsWith("/api/proxy/");
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export default function middleware(req: NextRequest, evt: NextFetchEvent) {
    if (!clerkEnabled) {
        return NextResponse.next();
    }

    if (shouldBypassClerk(req)) {
        return NextResponse.next();
    }

    return clerkHandler(req, evt);
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
