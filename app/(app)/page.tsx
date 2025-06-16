"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  CreditCard,
  BarChart,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  DollarSign,
  MapPin,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const supabase = createClient();

interface DashboardStats {
  totalMembers: number;
  upcomingEvents: number;
  monthlyRevenue: number;
  reportsGenerated: number;
  recentMembers: Array<{
    id: string;
    name: string;
    created_at: string;
  }>;
  recentEvents: Array<{
    id: string;
    title: string;
    event_date: string;
    location: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    payment_date: string;
    members: {
      name: string;
    } | null;
  }>;
}

interface Activity {
  id: string;
  type: "member" | "event" | "payment";
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    upcomingEvents: 0,
    monthlyRevenue: 0,
    reportsGenerated: 0,
    recentMembers: [],
    recentEvents: [],
    recentPayments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<
    Array<{
      id: string;
      title: string;
      event_date: string;
      location: string;
      description: string;
    }>
  >([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchUpcomingEvents();
  }, []);

  async function fetchDashboardStats() {
    try {
      setIsLoading(true);
      // Fetch total members
      const { count: membersCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });

      // Fetch upcoming events (this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const { data: events } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", startOfMonth.toISOString())
        .lte("event_date", endOfMonth.toISOString());

      // Fetch monthly revenue
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .gte("payment_date", startOfMonth.toISOString())
        .lte("payment_date", endOfMonth.toISOString());

      // Fetch recent members
      const { data: recentMembers } = await supabase
        .from("members")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent events
      const { data: recentEvents } = await supabase
        .from("events")
        .select("id, title, event_date, location")
        .order("event_date", { ascending: true })
        .limit(5);

      // Fetch recent payments
      const { data: recentPayments } = await supabase
        .from("payments")
        .select(
          `
          id,
          amount,
          payment_date,
          members (
            name
          )
        `
        )
        .order("payment_date", { ascending: false })
        .limit(5)
        .returns<
          Array<{
            id: string;
            amount: number;
            payment_date: string;
            members: {
              name: string;
            } | null;
          }>
        >();

      const monthlyRevenue =
        payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      setStats({
        totalMembers: membersCount || 0,
        upcomingEvents: events?.length || 0,
        monthlyRevenue,
        reportsGenerated: 0, // This would need a reports table
        recentMembers: recentMembers || [],
        recentEvents: recentEvents || [],
        recentPayments: recentPayments || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUpcomingEvents() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: events } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today.toISOString())
        .order("event_date", { ascending: true })
        .limit(5);

      setUpcomingEvents(events || []);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    }
  }

  const recentActivities: Activity[] = [
    ...stats.recentMembers.map((member) => ({
      id: member.id,
      type: "member" as const,
      title: `New member joined: ${member.name}`,
      description: format(new Date(member.created_at), "MMM d, yyyy"),
      date: member.created_at,
      icon: <UserPlus className="h-4 w-4 text-primary" />,
    })),
    ...stats.recentEvents.map((event) => ({
      id: event.id,
      type: "event" as const,
      title: event.title,
      description: `${format(new Date(event.event_date), "MMM d, yyyy")} at ${
        event.location
      }`,
      date: event.event_date,
      icon: <CalendarCheck className="h-4 w-4 text-primary" />,
    })),
    ...stats.recentPayments.map((payment) => ({
      id: payment.id,
      type: "payment" as const,
      title: `Payment received from ${payment.members?.name}`,
      description: `$${payment.amount} on ${format(
        new Date(payment.payment_date),
        "MMM d, yyyy"
      )}`,
      date: payment.payment_date,
      icon: <DollarSign className="h-4 w-4 text-primary" />,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5); // Only show the 5 most recent activities

  return (
    <div className="flex flex-col">
      {/* <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
      </header> */}

      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/members">
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {stats.totalMembers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active community members
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/events">
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {stats.upcomingEvents}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Events scheduled this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/payments">
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Revenue
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${stats.monthlyRevenue}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total revenue this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports">
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {stats.reportsGenerated}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reports generated this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="ml-4 space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-center"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.icon}
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        No recent activity
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Activity will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next 5 scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[180px]" />
                      </div>
                    ))}
                  </>
                ) : upcomingEvents.filter(
                    (event) => new Date(event.event_date) > new Date()
                  ).length > 0 ? (
                  upcomingEvents
                    .filter((event) => new Date(event.event_date) > new Date())
                    .sort(
                      (a, b) =>
                        new Date(a.event_date).getTime() -
                        new Date(b.event_date).getTime()
                    )
                    .slice(0, 5)
                    .map((event, index) => (
                      <div key={event.id} className="group relative">
                        <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <div className="rounded-full bg-primary/10 p-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="font-semibold leading-none tracking-tight">
                                  {event.title}
                                </h3>
                              </div>
                              <div className="flex flex-col gap-1.5 pl-10">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{event.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>
                                    {format(
                                      new Date(event.event_date),
                                      "EEEE, MMMM d, yyyy 'at' h:mm a"
                                    )}
                                  </span>
                                </div>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                          </div>
                        </div>
                        {index <
                          Math.min(
                            upcomingEvents.filter(
                              (event) => new Date(event.event_date) > new Date()
                            ).length - 1,
                            4
                          ) && <div className="h-px bg-border my-4" />}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">No upcoming events</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check back later for new events
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
