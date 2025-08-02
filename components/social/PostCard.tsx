"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Send,
  Trash2,
  Edit
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { type Post, type Comment } from "@/lib/client/social";
import { createComment, likePost, unlikePost, deletePost } from "@/lib/client/social";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onUpdate?: () => void;
}

export function PostCard({ post, currentUserId, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(!!post.has_liked);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (isLiked) return; // Prevent double-like
    try {
      setIsLoading(true);
      await likePost(post.id, currentUserId);
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    } catch (error) {
      toast.error("Failed to update like");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlike = async () => {
    if (!isLiked) return;
    try {
      setIsLoading(true);
      await unlikePost(post.id, currentUserId);
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to update like");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment = await createComment({
        post_id: post.id,
        member_id: currentUserId,
        content: newComment,
      });
      
      setComments(prev => [...prev, comment]);
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id, currentUserId);
      toast.success("Post deleted");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const { fetchComments } = await import("@/lib/client/social");
        const comments = await fetchComments(post.id);
        setComments(comments);
      } catch (error) {
        toast.error("Failed to load comments");
      }
    }
    setShowComments(!showComments);
  };

  const isOwner = post.member_id === currentUserId;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.member?.avatar} />
              <AvatarFallback>{post.member?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.member?.name || "Unknown User"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
        
        {post.image_url && (
  <div className="mt-4 flex justify-center">
    <img
      src={post.image_url}
      alt="Post image"
      className="rounded-lg object-cover w-full max-w-md h-48"
    />
  </div>
) }
      </CardContent>

      <CardFooter className="flex flex-col pt-0">
        <div className="flex items-center justify-between w-full py-2 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 ${isLiked ? "text-red-500" : ""}`}
              onClick={isLiked ? handleUnlike : handleLike}
              disabled={isLoading || (isLiked && !onUpdate)}
              aria-label={isLiked ? "Unlike post" : "Like post"}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
            </Button>
            <span className="text-xs ml-1">{likeCount}</span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={loadComments}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {comments.length || post.comments || 0}
            </Button>
            
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="w-full pt-4 border-t">
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.member?.avatar} />
                    <AvatarFallback>{comment.member?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="font-semibold text-sm">{comment.member?.name}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-0 resize-none"
                rows={2}
              />
              <Button onClick={handleComment} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
