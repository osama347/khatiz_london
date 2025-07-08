import React from "react";
import { type LucideIcon } from "lucide-react";
import useSWR, { mutate } from "swr";
import { fetchMembers } from "@/lib/server/members";
import { fetchEvents } from "@/lib/server/events";
import { fetchPaymentTrends } from "@/lib/server/reports";
import { fetchPayments } from "@/lib/server/payments";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    badge?: React.ReactNode;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  // Prefetch logic
  const handlePrefetch = (url: string) => {
    if (url.includes("/members")) {
      mutate(
        ["members", "", 1, 10],
        fetchMembers({ searchTerm: "", page: 1, pageSize: 10 })
      );
    } else if (url.includes("/events")) {
      mutate(
        ["events", "", 1, 10],
        fetchEvents({ searchTerm: "", page: 1, pageSize: 10 })
      );
    } else if (url.includes("/reports")) {
      mutate(
        ["paymentTrends", "week"],
        fetchPaymentTrends({ timeRange: "week" })
      );
    } else if (url.includes("/payments")) {
      mutate(
        ["payments", "", 1, 10],
        fetchPayments({ searchTerm: "", page: 1, pageSize: 10 })
      );
    }
  };
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a
                  href={item.url}
                  onMouseEnter={() => handlePrefetch(item.url)}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
