import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function fetchNotificationsByMemberId(memberId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) throw error;
  return true;
}

export async function markAllNotificationsAsRead(memberId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("member_id", memberId)
    .eq("is_read", false);
  if (error) throw error;
  return true;
}
