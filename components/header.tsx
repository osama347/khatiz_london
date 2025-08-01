"use client";

import { Bell } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  RealtimeChannel,
  REALTIME_CHANNEL_STATES,
} from "@supabase/supabase-js";
import LanguageSwitcher from "@/components/language-switcher";
import useSWR from "swr";
import { fetchFullMemberByEmail } from "@/lib/server/members";
import {
  fetchNotificationsByMemberId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/server/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const supabase = createClient();

interface Notification {
  id: string;
  member_id: string;
  type: "event" | "payment";
  message: string;
  is_read: boolean;
  send_at: string;
  created_at: string;
  metadata?: {
    event_id?: string;
    payment_id?: string;
    amount?: number;
    event_name?: string;
  };
}

export function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setUserEmail(data.user.email);
    }
    getUserEmail();
  }, []);
  const { data: member } = useSWR(
    userEmail ? ["member", userEmail] : null,
    () => fetchFullMemberByEmail(userEmail!)
  );
  const isAdmin = member?.role === "admin";

  const fetchNotifications = async () => {
    if (!member?.id) return;
    try {
      const data = await fetchNotificationsByMemberId(member.id);
      setNotifications(data || []);
      setUnreadCount(
        (data as Notification[])?.filter((n: Notification) => !n.is_read)
          .length || 0
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const setupNotificationSubscription = () => {
    // Clean up existing channel if any
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error("Error removing channel:", error);
      }
    }

    try {
      const channel = supabase
        .channel("supabase_realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          (payload: { new: Notification }) => {
            console.log("New notification received:", payload);
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            toast.info(payload.new.message);
          }
        )
        .subscribe((status: string) => {
          console.log("Notification subscription status:", status);
          if (status === "SUBSCRIBED") {
            console.log("Successfully subscribed to notifications");
            setIsSubscribed(true);
            // Clear any existing reconnect timeout
          }
        });

      channelRef.current = channel;

      // Set up a heartbeat to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          if (channel && channel.state === ("SUBSCRIBED" as any)) {
            channel.send({
              type: "broadcast",
              event: "heartbeat",
              payload: { timestamp: new Date().toISOString() },
            });
          } else {
            // If channel is not subscribed, clear the heartbeat and attempt to reconnect
            clearInterval(heartbeat);
            setupNotificationSubscription();
          }
        } catch (error) {
          console.error("Error in heartbeat:", error);
          clearInterval(heartbeat);
          setupNotificationSubscription();
        }
      }, 30000); // Send heartbeat every 30 seconds

      return () => {
        clearInterval(heartbeat);
      };
    } catch (error) {
      console.error("Error setting up notification subscription:", error);
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect to notifications...");
        setupNotificationSubscription();
      }, 5000);
      return () => {};
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
    fetchNotifications();

    const cleanup = setupNotificationSubscription();

    return () => {
      cleanup();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.error("Error removing channel:", error);
        }
      }
    };
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!member?.id) return;
    try {
      await markAllNotificationsAsRead(member.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "event":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-500"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        );
      case "payment":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-green-500"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        );
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationAction = (notification: Notification) => {
    switch (notification.type) {
      case "event":
        return (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              // Navigate to event details
              window.location.href = `/events/${notification.metadata?.event_id}`;
            }}
          >
            View Event Details
          </Button>
        );
      case "payment":
        return (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              // Navigate to payment details
              window.location.href = `/payments/${notification.metadata?.payment_id}`;
            }}
          >
            View Payment Details
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between max-w-6xl mx-auto px-4 py-2 gap-x-4 p-6">
        {/* Left: Logo or Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-lg truncate">Community Portal</span>
        </div>
        {/* Admin Navigation - Hidden on Mobile */}
        {isAdmin && (
          <nav className="hidden md:flex items-center space-x-6 ml-8">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = "/"}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = "/members"}
            >
              Members
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = "/payments"}
            >
              Payments
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = "/events"}
            >
              Events
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = "/reports"}
            >
              Reports
            </Button>
          </nav>
        )}
        {/* Right: Language Switcher, Notifications, User */}
        <div className="flex items-center gap-4 min-w-0">
          <LanguageSwitcher />
          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-2 font-semibold border-b">Notifications</div>
              <ScrollArea className="h-64">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-2 px-4 py-2 border-b last:border-b-0 ${
                        n.is_read ? "bg-background" : "bg-accent/30"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{n.message}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {format(new Date(n.send_at), "PPpp")}
                        </div>
                      </div>
                      {!n.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(n.id)}
                          className="ml-2"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </ScrollArea>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full rounded-none border-t"
                  onClick={async () => {
                    await markAllNotificationsAsRead(member?.id);
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, is_read: true }))
                    );
                    setUnreadCount(0);
                    toast.success("All notifications marked as read");
                  }}
                >
                  Mark all as read
                </Button>
              )}
            </PopoverContent>
          </Popover>
          {/* User Avatar/Profile (optional) */}
          {user && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar>
                    <AvatarImage
                      src={member?.avatar}
                      alt={member?.name || "@user"}
                    />
                    <AvatarFallback>
                      {member?.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/profile")}
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
