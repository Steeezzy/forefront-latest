"use client";

import { Button } from "@/components/ui/button";

export function TopBanner() {
    return (
        <div style={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #bae6fd', color: '#0369a1', fontSize: '13px' }} className="w-full h-12 flex items-center justify-center px-4 sticky top-0 z-50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <span>Chat Widget is not visible to your customers. Go to Settings to finish the setup.</span>
                <Button
                    variant="secondary"
                    size="sm"
                    style={{ backgroundColor: '#0369a1', color: 'white', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 500 }}
                    className="border-none h-auto"
                >
                    Complete setup
                </Button>
            </div>
        </div>
    );
}
