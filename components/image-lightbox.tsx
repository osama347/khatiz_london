"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { X, Download, Heart, MessageCircle, Share } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { GalleryItem } from "./gallery-item"

interface ImageLightboxProps {
  item: GalleryItem
  onLike: (itemId: string) => void
  children: React.ReactNode
}

export function ImageLightbox({ item, onLike, children }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = item.image
    link.download = `${item.user.username}-${item.id}.${item.type === "video" ? "mp4" : "jpg"}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
        <div className="flex h-full">
          {/* Image/Video Section */}
          <div className="flex-1 bg-black flex items-center justify-center">
            {item.type === "video" ? (
              <video src={item.image} className="max-w-full max-h-full object-contain" controls autoPlay />
            ) : (
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.caption}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Info Panel */}
          <div className="w-80 bg-background border-l flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={item.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {item.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{item.user.name}</p>
                  <p className="text-xs text-muted-foreground">@{item.user.username}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4">
              <p className="text-sm">{item.caption}</p>

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-xs text-blue-500 hover:underline cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">{item.timestamp}</p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-red-500"
                    onClick={() => onLike(item.id)}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${item.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span className="text-xs">{item.likes}</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-blue-500">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{item.comments}</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-blue-500">
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
