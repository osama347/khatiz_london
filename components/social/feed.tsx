"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Post, type PostData } from "./post"

import { useEffect, useState } from "react"
import { fetchPosts as fetchPostsApi } from "@/lib/client/social"

export function Feed() {
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)
      try {
        const backendPosts = await fetchPostsApi()
        // Map backend Post to PostData
        const mapped = backendPosts.map((p: any) => ({
          id: String(p.id),
          user: {
            name: p.member?.name || "Unknown",
            username: p.member?.name?.toLowerCase().replace(/\s+/g, "") || "user",
            avatar: p.member?.avatar || "/placeholder.svg",
          },
          content: p.content,
          image: p.image_url,
          timestamp: new Date(p.created_at).toLocaleString(),
          likes: p.likes ?? 0,
          comments: p.comments ?? 0,
          reposts: 0,
          isLiked: !!p.has_liked,
          isBookmarked: false,
        }))
        setPosts(mapped)
      } catch {
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    loadPosts()
  }, [])

  if (loading) {
    return <div className="p-6 text-center">Loading posts...</div>
  }

  if (posts.length === 0) {
    return <div className="p-6 text-center text-muted-foreground">No posts yet.</div>
  }

  return (
    <div className="space-y-0">
      {posts.map((post, index) => (
        <div key={post.id}>
          <Post post={post} onLike={() => {}} onBookmark={() => {}} />
          {index < posts.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}

