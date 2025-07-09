"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import useSWR, { mutate } from "swr";
import { fetchMembers } from "@/lib/server/members";
import { fetchEvents } from "@/lib/server/events";
import { fetchPaymentTrends } from "@/lib/server/reports";
import { fetchPayments } from "@/lib/server/payments";
import { fetchMemberByEmail } from "@/lib/server/members";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
}) {
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
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            <Link href={item.url} onMouseEnter={() => handlePrefetch(item.url)}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
