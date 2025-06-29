"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Calendar, Home, Users, CreditCard, BarChart } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";

const translations = {
  en: {
    home: "Home",
    members: "Members",
    payments: "Payments",
    reports: "Reports",
    events: "Events",
  },
  ps: {
    home: "کور",
    members: "غړي",
    payments: "تادیې",
    reports: "راپورونه",
    events: "پیښې",
  },
};

type Locale = keyof typeof translations;

// This is sample data.
const getNavData = (locale: Locale) => ({
  navMain: [
    {
      title: translations[locale].home,
      url: "/",
      icon: Home,
    },
    {
      title: translations[locale].members,
      url: "/members",
      icon: Users,
    },
    {
      title: translations[locale].payments,
      url: "/payments",
      icon: CreditCard,
    },
    {
      title: translations[locale].reports,
      url: "/reports",
      icon: BarChart,
    },
    {
      title: translations[locale].events,
      url: "/events",
      icon: Calendar,
    },
  ],
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
});

export function SidebarLeft({
  locale = "en",
  ...props
}: React.ComponentProps<typeof Sidebar> & { locale?: Locale }) {
  const pathname = usePathname();
  const currentLocale: Locale = (
    locale in translations ? locale : "en"
  ) as Locale;

  const data = getNavData(currentLocale);

  // Detect current locale from pathname
  const segments = pathname.split("/");
  const detectedLocale =
    segments[1] === "en" || segments[1] === "ps" ? segments[1] : "en";

  // Add locale prefix to all navigation URLs
  const navMainWithLocale = data.navMain.map((item) => ({
    ...item,
    url: `/${detectedLocale}${item.url}`,
  }));

  const navMainWithActive = navMainWithLocale.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }));

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
