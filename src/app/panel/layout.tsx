import { Sidebar } from '@/components/layout/Sidebar';
import { UsageBar } from '@/components/dashboard/UsageBar';
import { AuthSync } from '@/components/auth/AuthSync';
import { TopBar } from '@/components/layout/topbar';

export default function PanelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-white dark:bg-[#0a0e1a] transition-colors duration-300">
            <AuthSync />
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden relative lg:ml-64 ml-[72px]">
                <TopBar />
                <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0a0e1a] flex flex-col transition-colors duration-300">
                    <div className="flex-1">
                        {children}
                    </div>
                </main>
            </div>
            {/* Fixed Usage Bar at bottom right */}
            <div className="absolute bottom-6 right-6 w-80 z-50">
                <UsageBar />
            </div>
        </div>
    );
}
