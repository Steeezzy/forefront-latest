import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Questron Agent - AI Automation Agency",
  description: "Automate Smarter. Grow Faster. With AI.",
};

// Wake up Render backend on app startup (free tier sleeps after inactivity)
fetch("https://forefront-latest.onrender.com/health").catch(() => {});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased scroll-smooth">
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
