"use client";

import dynamic from "next/dynamic";

const ErrorReporter = dynamic(
    () => import("./ErrorReporter"),
    { ssr: false }
);

export default function DevTools() {
    return (
        <>
            <ErrorReporter />
        </>
    );
}
