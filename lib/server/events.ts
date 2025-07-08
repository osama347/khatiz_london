import { createClient } from "@/utils/supabase/client";

export async function fetchEvents({
  searchTerm = "",
  page = 1,
  pageSize = 10,
}: {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createClient();
  let query = supabase.from("events").select("*", { count: "exact" });

  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
    );
  }

  query = query
    .order("event_date", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data, count };
}

