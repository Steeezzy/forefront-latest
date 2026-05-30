'use client';

import { ShopifySidebar } from './_components/ShopifySidebar';
import { ShopifyTopbar } from './_components/ShopifyTopbar';

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <ShopifySidebar />
      <ShopifyTopbar />
      <div className="ml-[200px] pt-12">
        <main className="min-h-[calc(100vh-48px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
