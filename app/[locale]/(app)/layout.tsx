import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Suspense } from "react";
import { AuthCheckWrapper } from "./auth-check-wrapper";

// Optimize font loading
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});

export default function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen w-full flex flex-col`}
    >
      <AuthCheckWrapper>
        <Header />
        <main className="flex-1">
          <Suspense fallback={<div />}>{children}</Suspense>
        </main>
      </AuthCheckWrapper>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ps" }];
}
