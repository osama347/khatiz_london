import { createClient } from "@/utils/supabase/client";

export async function fetchMembers({
  searchTerm = "",
  page = 1,
  pageSize = 10,
}: {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createClient();
  let query = supabase.from("members").select("*", { count: "exact" });

  if (searchTerm) {
    query = query.or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data, count };
}

export async function fetchMemberByEmail(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, name, email, role")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchFullMemberByEmail(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMemberById(id: string, updates: Partial<any>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
