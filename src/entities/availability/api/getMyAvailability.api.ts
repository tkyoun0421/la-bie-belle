import type { DB } from "@/shared/api/database";
import { nextMonthStart } from "@/shared/utils/monthRange";

export async function getMyAvailability(
  client: DB,
  month: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("availabilities")
    .select("work_date")
    .gte("work_date", `${month}-01`)
    .lt("work_date", nextMonthStart(month))
    .order("work_date")
    .returns<{ work_date: string }[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.work_date);
}
