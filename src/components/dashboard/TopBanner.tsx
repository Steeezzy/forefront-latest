"use client";

import { Button } from "@/components/ui/button";

export function TopBanner() {
    return (
        <div className="w-full h-12 bg-blue-900/90 flex items-center justify-center px-4 text-sm font-medium text-white sticky top-0 z-50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <span>Chat Widget is not visible to your customers. Go to Settings to finish the setup.</span>
                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white border-none h-8 px-4 rounded-lg font-semibold"
                >
                    Complete setup
                </Button>
            </div>
        </div>
    );
}
