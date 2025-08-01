"use client"

import { useState } from "react"
import Link from "next/link"
import { GalleryGrid } from "@/components/gallery-grid"
import { GalleryUpload } from "@/components/gallery-upload"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GalleryItem } from "@/components/gallery-item"

const mockGalleryItems: GalleryItem[] = [
  {
    id: "1",
    user: {
      name: "Emma Wilson",
      username: "emmaw",
      avatar: "/placeholder.svg?height=40&width=40&text=EW",
    },
    image: "/placeholder.svg?height=400&width=300&text=Nature+Photography",
    caption: "Golden hour at the mountains 🏔️",
    timestamp: "3h",
    likes: 142,
    comments: 23,
    isLiked: false,
    tags: ["nature", "photography", "mountains"],
    type: "image",
  },
  {
    id: "2",
    user: {
      name: "David Kim",
      username: "davidk",
      avatar: "/placeholder.svg?height=40&width=40&text=DK",
    },
    image: "/placeholder.svg?height=300&width=400&text=Street+Art",
    caption: "Amazing street art I found downtown",
    timestamp: "5h",
    likes: 89,
    comments: 12,
    isLiked: true,
    tags: ["art", "street", "urban"],
    type: "image",
  },
  {
    id: "3",
    user: {
      name: "Lisa Chen",
      username: "lisac",
      avatar: "/placeholder.svg?height=40&width=40&text=LC",
    },
    image: "/placeholder.svg?height=400&width=400&text=Food+Photography",
    caption: "Homemade pasta night 🍝",
    timestamp: "1d",
    likes: 234,
    comments: 45,
    isLiked: false,
    tags: ["food", "cooking", "homemade"],
    type: "image",
  },
  {
    id: "4",
    user: {
      name: "Mike Rodriguez",
      username: "miker",
      avatar: "/placeholder.svg?height=40&width=40&text=MR",
    },
    image: "/placeholder.svg?height=300&width=300&text=Pet+Photo",
    caption: "My cat being photogenic as always 📸",
    timestamp: "2d",
    likes: 156,
    comments: 28,
    isLiked: true,
    tags: ["pets", "cats", "cute"],
    type: "image",
  },
  {
    id: "5",
    user: {
      name: "Anna Taylor",
      username: "annat",
      avatar: "/placeholder.svg?height=40&width=40&text=AT",
    },
    image: "/placeholder.svg?height=400&width=300&text=Architecture",
    caption: "Modern architecture meets classic design",
    timestamp: "3d",
    likes: 98,
    comments: 15,
    isLiked: false,
    tags: ["architecture", "design", "modern"],
    type: "image",
  },
  {
    id: "6",
    user: {
      name: "James Park",
      username: "jamesp",
      avatar: "/placeholder.svg?height=40&width=40&text=JP",
    },
    image: "/placeholder.svg?height=300&width=400&text=Workout+Video",
    caption: "Morning workout routine - stay consistent! 💪",
    timestamp: "4d",
    likes: 67,
    comments: 8,
    isLiked: false,
    tags: ["fitness", "workout", "motivation"],
    type: "video",
  },
]

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(mockGalleryItems)
  const [activeTab, setActiveTab] = useState("all")

  const handleLike = (itemId: string) => {
    setGalleryItems(
      galleryItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              isLiked: !item.isLiked,
              likes: item.isLiked ? item.likes - 1 : item.likes + 1,
            }
          : item,
      ),
    )
  }

  const handleUpload = (caption: string, tags: string[], type: "image" | "video", file: File | null) => {
    if (!file) return

    // Create object URL for the uploaded file
    const imageUrl = URL.createObjectURL(file)

    const newItem: GalleryItem = {
      id: Date.now().toString(),
      user: {
        name: "You",
        username: "you",
        avatar: "/placeholder.svg?height=40&width=40&text=You",
      },
      image: imageUrl,
      caption,
      timestamp: "now",
      likes: 0,
      comments: 0,
      isLiked: false,
      tags,
      type,
    }
    setGalleryItems([newItem, ...galleryItems])
  }

  const filteredItems = galleryItems.filter((item) => {
    if (activeTab === "all") return true
    if (activeTab === "images") return item.type === "image"
    if (activeTab === "videos") return item.type === "video"
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold">Community Gallery</h1>
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Feed
              </Button>
            </Link>
          </div>
        </div>

        {/* Upload Section */}
        <div className="p-4 border-b">
          <GalleryUpload onUpload={handleUpload} />
        </div>

        {/* Filter Tabs */}
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <GalleryGrid items={filteredItems} onLike={handleLike} />
            </TabsContent>

            <TabsContent value="images" className="mt-6">
              <GalleryGrid items={filteredItems} onLike={handleLike} />
            </TabsContent>

            <TabsContent value="videos" className="mt-6">
              <GalleryGrid items={filteredItems} onLike={handleLike} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
