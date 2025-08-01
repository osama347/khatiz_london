"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share, Play } from "lucide-react"
import { ImageLightbox } from "./image-lightbox"

export interface GalleryItem {
  id: string
  user: {
    name: string
    username: string
    avatar: string
  }
  image: string
  caption: string
  timestamp: string
  likes: number
  comments: number
  isLiked: boolean
  tags: string[]
  type: "image" | "video"
}

interface GalleryItemProps {
  item: GalleryItem
  onLike: (itemId: string) => void
}

export function GalleryItemComponent({ item, onLike }: GalleryItemProps) {
  return (
    <ImageLightbox item={item} onLike={onLike}>
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="relative aspect-square overflow-hidden">
          {item.type === "video" ? (
            <video
              src={item.image || "/placeholder.svg"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              muted
              loop
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => e.currentTarget.pause()}
            />
          ) : (
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.caption}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=400&width=400&text=Image+Error"
              }}
            />
          )}
          {item.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 rounded-full p-3">
                <Play className="w-6 h-6 text-black fill-black" />
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {item.type}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={item.user.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {item.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{item.user.name}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs">{item.timestamp}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.caption}</p>

          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 pb-4 px-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(item.id)
                }}
              >
                <Heart className={`w-4 h-4 mr-1 ${item.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                <span className="text-xs">{item.likes}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">{item.comments}</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
              onClick={(e) => e.stopPropagation()}
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </ImageLightbox>
  )
}
