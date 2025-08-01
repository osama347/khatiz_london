"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Video, Smile } from "lucide-react"

interface PostComposerProps {
  onPost: (content: string) => void
}

export function PostComposer({ onPost }: PostComposerProps) {
  const [newPost, setNewPost] = useState("")

  const handlePost = () => {
    if (newPost.trim()) {
      onPost(newPost)
      setNewPost("")
    }
  }

  return (
    <Card className="border-x-0 border-t-0 rounded-none">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="/placeholder.svg?height=40&width=40&text=You" />
            <AvatarFallback>You</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] border-0 p-0 text-lg placeholder:text-muted-foreground resize-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handlePost} disabled={!newPost.trim()} className="rounded-full px-6">
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
