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
  Heart,
  MessageCircle,
  Share2,
  ImageIcon,
} from "lucide-react";

import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getTranslations } from "@/lib/translations";
import useSWR from "swr";
import { fetchMemberByEmail } from "@/lib/client/members";
import { CreatePost } from "@/components/social/CreatePost";
import { PostCard } from "@/components/social/PostCard";
import { type Post } from "@/lib/client/social";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";



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

export default function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const loadPosts = async () => {
    if (!currentUser) return;
    
    setIsLoadingPosts(true);
    try {
      const { fetchPosts } = await import("@/lib/client/social");
      const posts = await fetchPosts();
      setPosts(posts);
    } catch (error) {
      console.error("Error loading posts:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
      });
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  useEffect(() => {
    getTranslations(resolvedParams.locale).then(setTranslations);
    fetchDashboardStats();
  }, [resolvedParams.locale]);

  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setUserEmail(data.user.email);
    }
    getUserEmail();
  }, []);

  const { data: member, isLoading: memberLoading } = useSWR(
    userEmail ? ["member", userEmail] : null,
    () => fetchMemberByEmail(userEmail!)
  );

  useEffect(() => {
    if (member) {
      setCurrentUser({
        id: member.id,
        name: member.name,
        avatar: member.avatar
      });
    }
  }, [member]);

  if (memberLoading || !userEmail) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (member?.role === "member") {
    if (!currentUser) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          <CreatePost currentUser={currentUser} onPostCreated={handlePostCreated} />
          <Separator />
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUserId={currentUser.id} 
                onUpdate={loadPosts} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  async function fetchDashboardStats() {
    try {
      setIsLoading(true);
      const [
        { count: membersCount },
        { data: events },
        { data: payments },
        { data: recentMembers },
        { data: recentEvents },
        { data: recentPayments },
        { data: userData },
      ] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*").gte("event_date", new Date().toISOString()),
        supabase.from("payments").select("amount").gte("payment_date", new Date().toISOString()),
        supabase.from("members").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("id, title, event_date, location").order("event_date", { ascending: true }).limit(5),
        supabase.from("payments").select("id, amount, payment_date, members(name)").order("payment_date", { ascending: false }).limit(5),
        supabase.auth.getUser(),
      ]);

      if (userData.user?.email) {
        const { fetchMemberByEmail } = await import("@/lib/server/members");
        const member = await fetchMemberByEmail(userData.user.email);
        if (member) {
          setCurrentUser({
            id: member.id,
            name: member.name,
            avatar: member.avatar,
          });
        }
      }

      const monthlyRevenue = payments?.reduce(
        (sum: number, payment: { amount?: number }) => sum + (payment.amount || 0),
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

  useEffect(() => {
    if (currentUser) {
      loadPosts();
    }
  }, [currentUser]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <TypographyIntro />
          
          {currentUser && (
            <CreatePost currentUser={currentUser} onPostCreated={handlePostCreated} />
          )}
          
          {isLoadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
                    <div className="h-20 bg-gray-300 rounded mb-4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUser?.id || ""} 
                  onUpdate={loadPosts} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-semibold">{stats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming Events</span>
                  <span className="font-semibold">{stats.upcomingEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                  <span className="font-semibold">${stats.monthlyRevenue.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentMembers.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
