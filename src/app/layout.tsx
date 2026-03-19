import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Questron Agent - AI Automation Agency",
  description: "Automate Smarter. Grow Faster. With AI.",
};

// Wake up Render backend on app startup (free tier sleeps after inactivity)
fetch("https://forefront-latest.onrender.com/health").catch(() => {});

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const app = (
    <html lang="en">
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="6558ee34-fe52-46ae-a9eb-33fd799a2715"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <AuthProvider>{children}</AuthProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );

  if (!clerkEnabled) {
    return app;
  }

  return <ClerkProvider>{app}</ClerkProvider>;
}
