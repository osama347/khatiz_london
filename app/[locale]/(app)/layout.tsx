import { Geist, Geist_Mono } from "next/font/google";
import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";
import { Header } from "@/components/header";

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
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <Header />
          <main className="flex-1">{children}</main>
          <SidebarRail />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ps" }];
}
