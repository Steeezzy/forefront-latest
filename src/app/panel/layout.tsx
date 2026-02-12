import { Sidebar } from '@/components/layout/Sidebar';
import { TopBanner } from '@/components/dashboard/TopBanner';
import { UsageBar } from '@/components/dashboard/UsageBar';

export default function PanelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#0f1115]">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <TopBanner />
                <main className="flex-1 overflow-y-auto bg-[#0f1115] flex flex-col">
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
