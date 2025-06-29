"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getTranslations, Locale as SupportedLocale } from "@/lib/translations";

const supabase = createClient();

export function NavUser() {
  const { isMobile } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [t, setT] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Detect locale from URL path
  const locale: SupportedLocale = useMemo(() => {
    const segments = pathname.split("/");
    return ["en", "ps"].includes(segments[1])
      ? (segments[1] as SupportedLocale)
      : "en";
  }, [pathname]);

  // Load translations on mount or locale change
  useEffect(() => {
    getTranslations(locale).then(setT);
  }, [locale]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(t?.signedOutSuccessfully || "Signed out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error(t?.failedToSignOut || "Failed to sign out");
    }
  }, [router, t]);

  const displayName = useMemo(() => {
    if (!user) return "User";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  }, [user]);

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [displayName]);

  if (!t) {
    return null;
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {t.loading || "Loading..."}
              </span>
              <span className="truncate text-xs">
                {t.pleaseWait || "Please wait"}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.user_metadata?.avatar_url}
                  alt={displayName}
                />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={displayName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t.logOut || "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
