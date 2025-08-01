"use client"

import { Bell, Menu, Home, Users, CreditCard, Calendar, BarChart3, ImageIcon } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import type { RealtimeChannel } from "@supabase/supabase-js"
import LanguageSwitcher from "@/components/language-switcher"
import useSWR from "swr"
import { fetchFullMemberByEmail } from "@/lib/server/members"
import {
  fetchNotificationsByMemberId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/server/notifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const supabase = createClient()

interface Notification {
  id: string
  member_id: string
  type: "event" | "payment"
  message: string
  is_read: boolean
  send_at: string
  created_at: string
  metadata?: {
    event_id?: string
    payment_id?: string
    amount?: number
    event_name?: string
  }
}

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Members", href: "/members", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Gallery", href: "/gallery", icon: ImageIcon },
]

export function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.email) setUserEmail(data.user.email)
    }
    getUserEmail()
  }, [])

  const { data: member } = useSWR(userEmail ? ["member", userEmail] : null, () => fetchFullMemberByEmail(userEmail!))

  const isAdmin = member?.role === "admin"

  const fetchNotifications = async () => {
    if (!member?.id) return
    try {
      const data = await fetchNotificationsByMemberId(member.id)
      setNotifications(data || [])
      setUnreadCount((data as Notification[])?.filter((n: Notification) => !n.is_read).length || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const setupNotificationSubscription = () => {
    // Clean up existing channel if any
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current)
      } catch (error) {
        console.error("Error removing channel:", error)
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
            console.log("New notification received:", payload)
            setNotifications((prev) => [payload.new as Notification, ...prev])
            setUnreadCount((prev) => prev + 1)
            toast.info(payload.new.message)
          },
        )
        .subscribe((status: string) => {
          console.log("Notification subscription status:", status)
          if (status === "SUBSCRIBED") {
            console.log("Successfully subscribed to notifications")
            setIsSubscribed(true)
          }
        })

      channelRef.current = channel

      const heartbeat = setInterval(() => {
        try {
          if (channel && channel.state === ("SUBSCRIBED" as any)) {
            channel.send({
              type: "broadcast",
              event: "heartbeat",
              payload: { timestamp: new Date().toISOString() },
            })
          } else {
            clearInterval(heartbeat)
            setupNotificationSubscription()
          }
        } catch (error) {
          console.error("Error in heartbeat:", error)
          clearInterval(heartbeat)
          setupNotificationSubscription()
        }
      }, 30000)

      return () => {
        clearInterval(heartbeat)
      }
    } catch (error) {
      console.error("Error setting up notification subscription:", error)
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect to notifications...")
        setupNotificationSubscription()
      }, 5000)
      return () => {}
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(data.user)
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    fetchUser()
    fetchNotifications()
    const cleanup = setupNotificationSubscription()

    return () => {
      cleanup()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (error) {
          console.error("Error removing channel:", error)
        }
      }
    }
  }, [])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      toast.success("Notification marked as read")
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!member?.id) return
    try {
      await markAllNotificationsAsRead(member.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Failed to mark all as read")
    }
  }

  const handleNavigation = (href: string) => {
    window.location.href = href
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between max-w-6xl mx-auto px-4 py-3">
        {/* Left: Logo and Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-6">
                {/* Admin Navigation */}
                {isAdmin && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Admin Navigation
                    </div>
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Button
                          key={item.name}
                          variant="ghost"
                          className="justify-start gap-3 h-12"
                          onClick={() => handleNavigation(item.href)}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Button>
                      )
                    })}
                    <div className="my-4 border-t" />
                  </>
                )}

                {/* Common Actions for All Users */}
                <div className="px-4 py-3">

  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
    Settings
  </div>

  {/* Language Switcher in Mobile Menu */}
  <div className="flex items-center justify-between px-3 py-2">
    <div className="text-sm font-medium">Language</div>
    <LanguageSwitcher />
  </div>

  <Button
    variant="ghost"
    className="justify-start gap-3 h-12 w-full"
    onClick={() => handleNavigation("/profile")}
  >
    <Users className="h-5 w-5" />
    Profile
  </Button>

  <Button
    variant="ghost"
    className="justify-start gap-3 h-12 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
    onClick={async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
      setIsMobileMenuOpen(false);
    }}
  >
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
    Logout
  </Button>

                </div>
                </div>

              {/* Mobile User Profile in Sheet */}
              {user && (
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member?.avatar || "/placeholder.svg"} alt={member?.name || "@user"} />
                      <AvatarFallback>{member?.name?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{member?.email}</p>
                      {isAdmin && <p className="text-xs text-blue-600 font-medium">Admin</p>}
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <span className="font-bold text-lg">Khatiz London</span>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <nav className="hidden md:flex items-center space-x-1">
          {/* Admin Navigation */}
          {isAdmin && (
            <>
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground gap-2"
                    onClick={() => handleNavigation(item.href)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                )
              })}
              <div className="mx-2 h-6 w-px bg-border" />
            </>
          )}

          {/* Common Navigation for All Users */}
          {/* <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground gap-2"
            onClick={() => handleNavigation("/profile")}
          >
            <Users className="h-4 w-4" />
            Profile
          </Button> */}
        </nav>

        {/* Right: Language Switcher, Notifications, User */}
        <div className="flex items-center gap-2">
          {/* Language Switcher - Always visible on desktop */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-3 border-b">
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-64">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-accent/50 ${
                        n.is_read ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(n.send_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {!n.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-xs px-2 h-6"
                        >
                          ✓
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Desktop User Avatar - Always visible when user exists */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member?.avatar || "/placeholder.svg"} alt={member?.name || "@user"} />
                    <AvatarFallback>{member?.name?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{member?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{member?.email}</p>
                    {isAdmin && <p className="text-xs leading-none text-blue-600 font-medium">Admin</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.href = "/"
                  }}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
