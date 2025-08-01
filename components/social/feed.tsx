"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Post, type PostData } from "./post"

interface FeedProps {
  posts: PostData[]
  onLike: (postId: string) => void
  onBookmark: (postId: string) => void
}

export function Feed({ posts, onLike, onBookmark }: FeedProps) {
  return (
    <div className="space-y-0">
      {posts.map((post, index) => (
        <div key={post.id}>
          <Post post={post} onLike={onLike} onBookmark={onBookmark} />
          {index < posts.length - 1 && <Separator />}
        </div>
      ))}

      {/* Load More */}
      <div className="p-4 text-center">
        <Button variant="ghost" className="text-muted-foreground">
          Load more posts
        </Button>
      </div>
    </div>
  )
}
