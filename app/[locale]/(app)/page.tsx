"use client";

import { useEffect, useState, use, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getTranslations } from "@/lib/translations";
import useSWR from "swr";
import { fetchMemberByEmail } from "@/lib/server/members";

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

function TypographyIntro() {
  return (
    <section className="w-full p-0 m-0 pt-8 pb-4">
      <div className="w-full m-0 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-2">
          Khatiz London
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-muted-foreground mb-3">
          Community Management Platform
        </h2>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-2">
          Welcome to{" "}
          <span className="font-bold text-primary">Khatiz London</span> — your
          all-in-one solution for managing community members, events, payments,
          and reports. Effortlessly organize, track, and grow your community
          with a modern, intuitive dashboard.
        </p>
      </div>
    </section>
  );
}

export default function Dashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
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
  const [translations, setTranslations] = useState<any>({});
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Load translations
    getTranslations(resolvedParams.locale).then(setTranslations);
    fetchDashboardStats();
  }, [resolvedParams.locale]);

  useEffect(() => {
    // Get the current Supabase user email
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setUserEmail(data.user.email);
    }
    getUserEmail();
  }, []);

  // Fetch member info (including role) using SWR
  const { data: member, isLoading: memberLoading } = useSWR(
    userEmail ? ["member", userEmail] : null,
    () => fetchMemberByEmail(userEmail!)
  );

  if (memberLoading || !userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  if (member?.role === "member") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome, {member.name}!</h1>
          <p className="text-muted-foreground">
            This is your member dashboard. Please contact an admin if you need
            more access.
          </p>
        </div>
      </div>
    );
  }

  async function fetchDashboardStats() {
    try {
      setIsLoading(true);

      // Parallel data fetching for better performance
      const [
        { count: membersCount },
        { data: events },
        { data: payments },
        { data: recentMembers },
        { data: recentEvents },
        { data: recentPayments },
      ] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase
          .from("events")
          .select("*")
          .gte("event_date", new Date().toISOString()),
        supabase
          .from("payments")
          .select("amount")
          .gte("payment_date", new Date().toISOString()),
        supabase
          .from("members")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("events")
          .select("id, title, event_date, location")
          .order("event_date", { ascending: true })
          .limit(5),
        supabase
          .from("payments")
          .select(
            `
          id,
          amount,
          payment_date,
          members (name)
        `
          )
          .order("payment_date", { ascending: false })
          .limit(5),
      ]);

      const monthlyRevenue =
        payments?.reduce(
          (sum: number, payment: { amount?: number }) =>
            sum + (payment.amount || 0),
          0
        ) || 0;

      setStats({
        totalMembers: membersCount || 0,
        upcomingEvents: events?.length || 0,
        monthlyRevenue,
        reportsGenerated: 0,
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

  const recentActivities: Activity[] = [
    ...stats.recentMembers.map((member) => ({
      id: member.id,
      type: "member" as const,
      title: `${translations.newMemberJoined || "New member joined"}: ${
        member.name
      }`,
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
      title: `${translations.paymentFrom || "Payment received from"} ${
        payment.members?.name
      }`,
      description: `$${payment.amount} on ${format(
        new Date(payment.payment_date),
        "MMM d, yyyy"
      )}`,
      date: payment.payment_date,
      icon: <DollarSign className="h-4 w-4 text-primary" />,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col ">
      {/* App Introduction Section */}
      <TypographyIntro />
      {/* End App Introduction Section */}
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href={`/${resolvedParams.locale}/members`}>
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {translations.totalMembers || "Total Members"}
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
                      {translations.activeMembers || "Active community members"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${resolvedParams.locale}/events`}>
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {translations.upcomingEvents || "Upcoming Events"}
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
                      {translations.eventsThisMonth ||
                        "Events scheduled this month"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${resolvedParams.locale}/payments`}>
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {translations.monthlyRevenue || "Monthly Revenue"}
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
                      {translations.revenueThisMonth ||
                        "Total revenue this month"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${resolvedParams.locale}/reports`}>
            <Card className="hover:bg-accent cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {translations.reports || "Reports"}
                </CardTitle>
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
                      {translations.reportsGenerated ||
                        "Reports generated this month"}
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
              <CardTitle>
                {translations.recentActivity || "Recent Activity"}
              </CardTitle>
              <CardDescription>
                {translations.latestUpdates ||
                  "Latest updates from your community"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      {activity.icon}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {translations.noActivity || "No recent activity"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
