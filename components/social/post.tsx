"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Bookmark } from "lucide-react"

export interface PostData {
  id: string
  user: {
    name: string
    username: string
    avatar: string
  }
  content: string
  image?: string
  timestamp: string
  likes: number
  comments: number
  reposts: number
  isLiked: boolean
  isBookmarked: boolean
}

interface PostProps {
  post: PostData
  onLike: (postId: string) => void
  onBookmark: (postId: string) => void
}

export function Post({ post, onLike, onBookmark }: PostProps) {
  return (
    <Card className="border-x-0 border-t-0 rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {post.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{post.user.name}</span>
              <span className="text-muted-foreground text-sm">@{post.user.username}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{post.timestamp}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <p className="text-sm leading-relaxed mb-3">{post.content}</p>
        {post.image && (
          <div className="rounded-xl overflow-hidden">
            <img src={post.image || "https://picsum.photos/200"} alt="Post content" className="w-full h-auto object-cover" />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50"
              onClick={() => onLike(post.id)}
            >
              <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span className="text-xs">{post.likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-green-500 hover:bg-green-50"
            >
              <Repeat2 className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.reposts}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50"
            onClick={() => onBookmark(post.id)}
          >
            <Bookmark className={`w-4 h-4 ${post.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
