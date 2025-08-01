"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Video, X, Plus, Upload } from "lucide-react"

interface GalleryUploadProps {
  onUpload: (caption: string, tags: string[], type: "image" | "video", file: File | null) => void
}

export function GalleryUpload({ onUpload }: GalleryUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [caption, setCaption] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [uploadType, setUploadType] = useState<"image" | "video">("image")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Auto-detect file type
      if (file.type.startsWith("image/")) {
        setUploadType("image")
      } else if (file.type.startsWith("video/")) {
        setUploadType("video")
      }
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleUpload = () => {
    if (caption.trim() && selectedFile) {
      onUpload(caption, tags, uploadType, selectedFile)
      setCaption("")
      setTags([])
      setTagInput("")
      setSelectedFile(null)
      setPreviewUrl(null)
      setIsOpen(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setCaption("")
    setTags([])
    setTagInput("")
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  if (!isOpen) {
    return (
      <div className="text-center">
        <Button onClick={() => setIsOpen(true)} className="rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Share to Gallery
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Share to Community Gallery</h3>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Upload File</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  {uploadType === "image" ? (
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg object-cover"
                    />
                  ) : (
                    <video src={previewUrl} className="max-h-48 mx-auto rounded-lg" controls />
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedFile?.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl)
                          setPreviewUrl(null)
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">Click to upload</span>
                      <span className="text-sm text-muted-foreground"> or drag and drop</span>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF, MP4 up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Upload Type</Label>
            <div className="flex gap-2">
              <Button
                variant={uploadType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setUploadType("image")}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button
                variant={uploadType === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => setUploadType("video")}
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption for your post..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    #{tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!caption.trim() || !selectedFile}>
              Share to Gallery
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
