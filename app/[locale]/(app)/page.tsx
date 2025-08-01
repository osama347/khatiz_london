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
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getTranslations } from "@/lib/translations";
import useSWR from "swr";
import { fetchMemberByEmail } from "@/lib/server/members";
import { Feed } from "@/components/social";
import { PostComposer } from "@/components/social/create-post";
import type { PostData } from "@/components/social/post";
import { Separator } from "@/components/ui/separator";

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
  const [posts, setPosts] = useState<PostData[]>([
    {
      id: "1",
      user: {
        name: "Sarah Chen",
        username: "sarahc",
        avatar: "https://picsum.photos/200",
      },
      content:
        "Just finished reading an amazing book about sustainable design. The intersection of technology and environmental consciousness is fascinating! 🌱✨",
      image: "https://picsum.photos/200",
      timestamp: "2h",
      likes: 24,
      comments: 8,
      reposts: 3,
      isLiked: false,
      isBookmarked: false,
    },
    {
      id: "2",
      user: {
        name: "Alex Rivera",
        username: "alexr",
        avatar: "https://picsum.photos/200",
      },
      content:
        "Working on a new project that combines AI and creative writing. The possibilities are endless when technology meets human creativity. What are your thoughts on AI-assisted creativity?",
      timestamp: "4h",
      likes: 156,
      comments: 32,
      reposts: 18,
      isLiked: true,
      isBookmarked: true,
    },
    {
      id: "3",
      user: {
        name: "Maya Patel",
        username: "mayap",
        avatar: "https://picsum.photos/200",
      },
      content:
        "Beautiful sunset from my morning hike. Sometimes you need to disconnect to reconnect with what matters most. 🌅",
      image: "https://picsum.photos/200",
      timestamp: "6h",
      likes: 89,
      comments: 15,
      reposts: 7,
      isLiked: false,
      isBookmarked: false,
    }
  ]);

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map((post) => (post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post)));
  };

  const handleNewPost = (content: string) => {
    const post: PostData = {
      id: Date.now().toString(),
      user: {
        name: "You",
        username: "you",
        avatar: "https://picsum.photos/200",
      },
      content,
      timestamp: "now",
      likes: 0,
      comments: 0,
      reposts: 0,
      isLiked: false,
      isBookmarked: false,
    };
    setPosts([post, ...posts]);
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

  if (memberLoading || !userEmail) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (member?.role === "member") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          <PostComposer onPost={handleNewPost} />
          <Separator />
          <Feed posts={posts} onLike={handleLike} onBookmark={handleBookmark} />
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
      ] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*").gte("event_date", new Date().toISOString()),
        supabase.from("payments").select("amount").gte("payment_date", new Date().toISOString()),
        supabase.from("members").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("id, title, event_date, location").order("event_date", { ascending: true }).limit(5),
        supabase.from("payments").select("id, amount, payment_date, members(name)").order("payment_date", { ascending: false }).limit(5),
      ]);

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
 return (
   <div className="flex flex-col">
<section className="w-full max-w-4xl mx-auto py-8 px-4">
  <div className="prose prose-lg md:prose-xl dark:prose-invert text-muted-foreground text-justify leading-relaxed space-y-6">
    <h1 className="text-2xl md:text-3xl font-bold text-primary">Welcome to Khatiz London</h1>

    <p>
      Established in <strong className="text-primary">2012</strong>, Khatiz London was born from a shared desire to preserve our identity and uplift our people. 
      In the heart of London, far from the rugged mountains of Khatiz, a resilient community has taken root — one built not on buildings or borders, but on kinship, culture, and care.
    </p>

    <p>
      Today, we stand strong with <strong className="text-primary">{stats.totalMembers} active members</strong>, each one carrying a piece of our shared history and a hope for the future.
      From elders who remember our roots to the youth forging ahead, every soul strengthens the fabric of our community.
    </p>

    {stats.upcomingEvents > 0 && (
      <p>
        This month brings us <strong className="text-primary">{stats.upcomingEvents} important events</strong>, each one a gathering of hearts — from community meetings and cultural nights 
        to charity drives and shared meals. These aren’t just events. They are how we stay whole.
      </p>
    )}

    <p>
      Through your generosity and dedication, we've raised <strong className="text-primary">${stats.monthlyRevenue}</strong> this month. These funds power our mission — offering language classes, 
      supporting widows and orphans, and organizing festivals that celebrate our rich heritage.
    </p>

    {stats.reportsGenerated > 0 && (
      <p>
        Accountability matters. We've published <strong className="text-primary">{stats.reportsGenerated} transparent reports</strong> so far — tracking every donation, every event, every project. 
        This is your organization, and every step we take is one we take together.
      </p>
    )}

    <p>
      From a few families gathering in a local park to an organized network of hundreds, our story is one of resilience, vision, and unwavering unity. 
      In Khatiz London, we are not just preserving our past — we are building a future our children will be proud of.
    </p>

    <p className="font-semibold text-primary">
      Together, we are the bridge — between generations, between homelands, and between dreams and reality. And we move forward, hand in hand.
    </p>
  </div>
</section>


    </div>
  );
}
