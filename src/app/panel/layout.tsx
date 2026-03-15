import { Sidebar } from '@/components/layout/Sidebar';
import { TopBanner } from '@/components/dashboard/TopBanner';
import { UsageBar } from '@/components/dashboard/UsageBar';
import { AuthSync } from '@/components/auth/AuthSync';

export default function PanelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f5f5f7]">
            <AuthSync />
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden relative" style={{ marginLeft: '56px' }}>
                <TopBanner />
                <main className="flex-1 overflow-y-auto bg-[#f4f4f5] flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>
                </main>
            </div>

            {/* Fixed Usage Bar at bottom right or similar location for visibility */}
            <div className="absolute bottom-6 right-6 w-80 z-50">
                <UsageBar />
            </div>
        </div>
    );
}
