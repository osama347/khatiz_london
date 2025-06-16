"use client";

import { Bell } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Breadcrumb } from "@/components/breadcrumb";
import { toast } from "sonner";
import {
  RealtimeChannel,
  REALTIME_CHANNEL_STATES,
} from "@supabase/supabase-js";

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

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
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
          (payload) => {
            console.log("New notification received:", payload);
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            toast.info(payload.new.message);
          }
        )
        .subscribe((status) => {
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
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
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
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-2">
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0"
            align="end"
            side="bottom"
            sideOffset={5}
          >
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    fetchNotifications();
                    toast.success("Notifications refreshed");
                  }}
                  title="Refresh notifications"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      notifications.forEach((n) => {
                        if (!n.is_read) handleMarkAsRead(n.id);
                      });
                    }}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {notifications.length > 0 ? (
                <div className="p-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group mb-4 rounded-lg border p-5 transition-all hover:shadow-md ${
                        notification.is_read
                          ? "bg-background hover:bg-accent/50"
                          : "bg-accent hover:bg-accent/80"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 rounded-full bg-background p-2.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-base font-medium capitalize">
                                  {notification.type}
                                </p>
                                {!notification.is_read && (
                                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              {notification.metadata?.amount && (
                                <div className="mt-2 flex items-center gap-2">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-green-500"
                                  >
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                  </svg>
                                  <p className="text-sm font-medium text-green-600">
                                    ${notification.metadata.amount}
                                  </p>
                                </div>
                              )}
                              {notification.metadata?.event_name && (
                                <p className="text-sm text-muted-foreground">
                                  Event: {notification.metadata.event_name}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs text-muted-foreground">
                                {format(
                                  new Date(notification.created_at),
                                  "MMM d, h:mm a"
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                              >
                                {notification.is_read
                                  ? "Mark as unread"
                                  : "Mark as read"}
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {getNotificationAction(notification)}
                            {notification.type === "payment" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  // Navigate to payment history
                                  window.location.href = "/payments";
                                }}
                              >
                                View Payment History
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                  <div className="text-center">
                    <Bell className="mx-auto h-16 w-16 text-muted-foreground" />
                    <p className="mt-6 text-base text-muted-foreground">
                      No notifications
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      You're all caught up!
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
