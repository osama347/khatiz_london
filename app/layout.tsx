import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { PerformanceMonitor } from "@/components/performance-monitor";

export const metadata: Metadata = {
  title: "East London",
  description: "East London Database Management System",
  // Performance optimizations
  // viewport and themeColor moved to viewport.ts
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <Toaster />
        <PerformanceMonitor />
      </body>
    </html>
  );
}
