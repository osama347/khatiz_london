"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import useSWR from "swr";

// UI Components (assuming these are correctly imported)
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// App-specific components and functions
import { getTranslations } from "@/lib/translations";
import { fetchMemberByEmail } from "@/lib/client/members";
import { CreatePost } from "@/components/social/CreatePost";
import { PostCard } from "@/components/social/PostCard";
import { type Post } from "@/lib/client/social";

const supabase = createClient();

// The TypographyIntro component can be kept or removed depending on if you want the header.
// I'll keep it here for context.
function TypographyIntro() {
  return (
    <section className="w-full p-0 m-0 pt-8 pb-4">
      <div className="w-full m-0 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-2">
          Khatiz London
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-muted-foreground mb-3">
          Community Social Feed
        </h2>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-2">
          Welcome to the <span className="font-bold text-primary">Khatiz London</span> community feed. Share updates, connect with others, and stay engaged.
        </p>
      </div>
    </section>
  );
}


export default function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const [translations, setTranslations] = useState<any>({});
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true); // Start as true

  // Get the logged-in user's email
  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    }
    getUserEmail();
  }, []);

  // Fetch the member profile using the email
  const { data: member, isLoading: memberLoading } = useSWR(
    userEmail ? ["member", userEmail] : null,
    () => fetchMemberByEmail(userEmail!)
  );

  // Set the current user's info once the member profile is loaded
  useEffect(() => {
    if (member) {
      setCurrentUser({
        id: member.id,
        name: member.name,
        avatar: member.avatar
      });
    }
  }, [member]);

  // Function to load posts from the server
  const loadPosts = async () => {
    setIsLoadingPosts(true);
    try {
      // Dynamically import the fetchPosts function
      const { fetchPosts } = await import("@/lib/client/social");
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Load posts as soon as the current user is identified
  useEffect(() => {
    if (currentUser) {
      loadPosts();
    }
  }, [currentUser]);

  // This function is passed to the CreatePost component to refresh the feed
  const handlePostCreated = () => {
    loadPosts();
  };

  // Handle loading state while fetching user info
  if (memberLoading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading Community Feed...</div>;
  }

  // --- Main Return Block ---
  // This layout is now shown to every user, regardless of their role.
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* <TypographyIntro /> */}
      
      <CreatePost currentUser={currentUser} onPostCreated={handlePostCreated} />
      
      <Separator className="my-6" />
      
      {isLoadingPosts ? (
        <div className="text-center text-muted-foreground">Loading posts...</div>
      ) : (
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUserId={currentUser.id} 
                onUpdate={loadPosts} 
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No posts yet. Be the first to share something!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
