import { createClient } from "@/utils/supabase/client";

export async function fetchPaymentTrends({
  timeRange = "week",
}: {
  timeRange: "week" | "month" | "year";
}) {
  const supabase = createClient();
  let groupBy, select, fromDate;
  const now = new Date();

  switch (timeRange) {
    case "week":
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 7);
      groupBy = "date";
      select = `date:paid_on::date, amount`;
      break;
    case "month":
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 30);
      groupBy = "date";
      select = `date:paid_on::date, amount`;
      break;
    case "year":
      fromDate = new Date(now);
      fromDate.setMonth(now.getMonth() - 12);
      groupBy = "month";
      select = `month:date_trunc('month', paid_on), amount`;
      break;
    default:
      throw new Error("Invalid time range");
  }

  let query = supabase
    .from("payments")
    .select(select, { count: "exact" })
    .gte("paid_on", fromDate.toISOString());

  const { data, error } = await query;
  if (error) throw error;

  // Aggregate in JS (Supabase does not support GROUP BY in client lib)
  const trends = {};
  for (const row of data) {
    const key = row.date || row.month;
    if (!trends[key]) trends[key] = 0;
    trends[key] += row.amount;
  }

  // Format for charting
  return Object.entries(trends).map(([date, amount]) => ({ date, amount }));
}

