"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send, X } from "lucide-react";
import { createPost, uploadSocialImage } from "@/lib/client/social";
import { toast } from "sonner";

interface CreatePostProps {
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onPostCreated?: () => void;
}

export function CreatePost({ currentUser, onPostCreated }: CreatePostProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB per file.");
      return;
    }
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
  };

  const removeImage = () => {
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please add a title and content");
      return;
    }

    setIsCreating(true);
    setIsUploading(true);

    try {
      // Create post with File objects - backend will handle upload
      await createPost({
        member_id: currentUser.id,
        title: title.trim(),
        content: content.trim(),
        file: selectedFile || undefined,
      });

      toast.success("Post created successfully");
      
      // Clean up
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
      setTitle("");
      setContent("");
      setPreviewImage(null);
      setSelectedFile(null);
      onPostCreated?.();
    } catch (error) {
      console.error("Post creation error:", error);
      toast.error("Failed to create post");
    } finally {
      setIsCreating(false);
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Input
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-semibold"
            />
            <Textarea
              placeholder={`What's on your mind, ${currentUser.name}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            
            {previewImage && (
              <div className="relative w-full max-w-xs mx-auto mb-4">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1"
                  onClick={() => {
                    if (previewImage.startsWith('blob:')) {
                      URL.revokeObjectURL(previewImage);
                    }
                    setPreviewImage(null);
                    setSelectedFile(null);
                  }}
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Image className="h-4 w-4 mr-2" />
            Add Photos
          </Button>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={isCreating || !title.trim() || !content.trim()}
        >
          <Send className="h-4 w-4 mr-2" />
          {isCreating ? "Posting..." : "Post"}
        </Button>
      </CardFooter>
    </Card>
  );
}
