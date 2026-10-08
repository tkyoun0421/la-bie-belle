import type { DB } from "@/shared/api/database";

export async function getFirstScheduleMonth(
  client: DB,
): Promise<string | null> {
  const { data, error } = await client
    .from("schedules")
    .select("month")
    .order("month")
    .limit(1)
    .maybeSingle<{ month: string }>();

  if (error) {
    throw error;
  }

  return data?.month ?? null;
}
