import { createClient } from "@/utils/supabase/client";

export async function fetchPayments({
  searchTerm = "",
  memberId,
  page = 1,
  pageSize = 10,
}: {
  searchTerm?: string;
  memberId?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from("payments")
    .select("*, member:members(id, name, avatar, email)", { count: "exact" });

  if (memberId) {
    query = query.eq("member_id", memberId);
  } else if (searchTerm) {
    query = query.or(
      `member.name.ilike.%${searchTerm}%,member.email.ilike.%${searchTerm}%`
    );
  }

  query = query
    .order("paid_on", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data, count };
}

export async function fetchMembersForPayments({
  search = "",
  limit = 10,
}: {
  search?: string;
  limit?: number;
}) {
  const supabase = createClient();
  let query = supabase.from("members").select("id, name, avatar");
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  query = query.order("name").limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
