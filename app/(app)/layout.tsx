import { Geist, Geist_Mono } from "next/font/google";
import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";
import { Header } from "@/components/header";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
