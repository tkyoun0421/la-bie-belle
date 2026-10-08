import type { DB } from "@/shared/api/database";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type { ExcuseRow } from "@/entities/excuse/api/excuse.dto";
import type { Excuse } from "@/entities/excuse/model/excuse.type";
import { toExcuse } from "@/entities/excuse/utils/excuse.mapper";

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

export async function getMyExcuses(
  client: DB,
  month: string,
): Promise<Excuse[]> {
  const { data: days, error: daysError } = await client
    .from("days")
    .select("id")
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month));

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

  return (data ?? []).map(toExcuse);
}
