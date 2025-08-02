import { createClient } from "@/utils/supabase/client";

// Post types
export interface Post {
  id: number;
  member_id: string;
  title: string;
  content: string;
  created_at: string;
  member?: {
    id: string;
    name: string;
    avatar?: string;
  };
  likes?: number;
  comments?: number;
  has_liked?: boolean;
  image_url?: string;
}

export interface Comment {
  id: string;
  post_id: number;
  member_id: string;
  content: string;
  created_at: string;
  member?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Like {
  id: number;
  post_id: number;
  member_id: string;
  created_at: string;
}

export interface Friendship {
  id: number;
  member_id: string;
  friend_id: string;
  created_at: string;
  friend?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  send_at: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Posts
export async function createPost(data: {
  member_id: string;
  title: string;
  content: string;
  file?: File;
}) {
  const supabase = createClient();
  
  let imageUrl: string | null = null;

  // Upload single image if provided
  if (data.file) {
    imageUrl = await uploadSocialImage(data.file, data.member_id);
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      member_id: data.member_id,
      title: data.title,
      content: data.content,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return post;
}

export async function fetchPosts(memberId?: string) {
  const supabase = createClient();
   
  try {
    // First, check if the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error("Authentication required");
    }
    if (!user) {
      throw new Error("No authenticated user");
    }
    
    console.log("Fetching posts for user:", user.id);
    
    let query = supabase
      .from("posts")
      .select(`
        *,
        member:members(id, name, avatar),
        likes:likes(count),
        comments:comments(count)
      `)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("Supabase error in fetchPosts:", error);
      throw new Error(error.message || "Failed to fetch posts");
    }

    // Transform the data to match our interface
    return data.map((post: any) => ({
      ...post,
      likes: post.likes?.[0]?.count || 0,
      comments: post.comments?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error("Error in fetchPosts:", error);
    throw error;
  }
}

export async function fetchPost(id: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      member:members(id, name, avatar),
      likes:likes(count),
      comments:comments(count)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return {
    ...data,
    likes: data.likes?.[0]?.count || 0,
    comments: data.comments?.[0]?.count || 0,
  };
}

export async function deletePost(postId: number, memberId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("member_id", memberId);

  if (error) throw error;
}

// Comments
export async function createComment(data: {
  post_id: number;
  member_id: string;
  content: string;
}) {
  const supabase = createClient();
  
  const { data: comment, error } = await supabase
    .from("comments")
    .insert(data)
    .select(`
      *,
      member:members(id, name, avatar)
    `)
    .single();

  if (error) throw error;
  return comment;
}

export async function fetchComments(postId: number) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      member:members(id, name, avatar)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string, memberId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("member_id", memberId);

  if (error) throw error;
}

// Likes
export async function likePost(postId: number, memberId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("likes")
    .insert({ post_id: postId, member_id: memberId });

  if (error) throw error;
}

export async function unlikePost(postId: number, memberId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("member_id", memberId);

  if (error) throw error;
}

export async function checkIfLiked(postId: number, memberId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("member_id", memberId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return !!data;
}

// Friendships
export async function sendFriendRequest(memberId: string, friendId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("friendships")
    .insert({ member_id: memberId, friend_id: friendId });

  if (error) throw error;
}

export async function removeFriend(memberId: string, friendId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(`member_id.eq.${memberId},friend_id.eq.${friendId}`)
    .or(`member_id.eq.${friendId},friend_id.eq.${memberId}`);

  if (error) throw error;
}

export async function fetchFriends(memberId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("friendships")
    .select(`
      *,
      friend:members!friend_id(id, name, avatar)
    `)
    .or(`member_id.eq.${memberId},friend_id.eq.${memberId}`);

  if (error) throw error;
  return data;
}

// Messages
export async function sendMessage(data: {
  sender_id: string;
  receiver_id: string;
  content: string;
}) {
  const supabase = createClient();
  
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      ...data,
      is_read: false,
      send_at: new Date().toISOString(),
    })
    .select(`
      *,
      sender:members!sender_id(id, name, avatar),
      receiver:members!receiver_id(id, name, avatar)
    `)
    .single();

  if (error) throw error;
  return message;
}

export async function fetchMessages(userId: string, otherUserId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:members!sender_id(id, name, avatar),
      receiver:members!receiver_id(id, name, avatar)
    `)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order("send_at", { ascending: true });

  if (error) throw error;
  return data as Message[];
}

export async function fetchConversations(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:members!sender_id(id, name, avatar),
      receiver:members!receiver_id(id, name, avatar)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("send_at", { ascending: false });

  if (error) throw error;

  // Group messages by conversation
  const conversations = new Map<string, any>();
  data.forEach((message: Message) => {
    const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
    const otherUser = message.sender_id === userId ? message.receiver : message.sender;
    
    if (!conversations.has(otherUserId) || message.send_at > conversations.get(otherUserId).last_message.send_at) {
      conversations.set(otherUserId, {
        user: otherUser,
        last_message: message,
        unread_count: message.receiver_id === userId && !message.is_read ? 1 : 0,
      });
    } else if (message.receiver_id === userId && !message.is_read) {
      conversations.get(otherUserId).unread_count++;
    }
  });

  return Array.from(conversations.values());
}

export async function markMessagesAsRead(userId: string, otherUserId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", userId)
    .eq("sender_id", otherUserId)
    .eq("is_read", false);

  if (error) throw error;
}

// File uploads
export async function uploadSocialImage(file: File, userId: string) {
  const supabase = createClient();
  
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from("socials")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from("socials")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
