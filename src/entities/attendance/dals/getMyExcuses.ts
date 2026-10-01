import type { Db } from "@/shared/api/database";

export type ExcuseRow = {
  id: string;
  day_id: string;
  profile_id: string;
  body: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
  decision_reason: string | null;
};

const COLUMNS = [
  "id",
  "day_id",
  "profile_id",
  "body",
  "submitted_at",
  "decided_at",
  "decision",
  "decision_reason",
].join(", ");

export function myExcusesKey(month: string): string[] {
  return ["excuses", month];
}

function nextMonthFirstDay(month: string): string {
  const [year, monthOfYear] = month.split("-").map(Number);
  const rolls = monthOfYear === 12;
  const nextYear = rolls ? year + 1 : year;
  const nextMonth = rolls ? 1 : monthOfYear + 1;

  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
}

export async function getMyExcuses(
  client: Db,
  month: string,
): Promise<ExcuseRow[]> {
  const { data: days, error: daysError } = await client
    .from("days")
    .select("id")
    .gte("work_date", `${month}-01`)
    .lt("work_date", nextMonthFirstDay(month));

  if (daysError) {
    throw daysError;
  }
  if (!days || days.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("excuses")
    .select(COLUMNS)
    .in(
      "day_id",
      days.map((day) => day.id),
    )
    .order("submitted_at", { ascending: false })
    .returns<ExcuseRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
