import type { DB } from "@/shared/api/database";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type { SlotRequest } from "@/entities/workRequest/api/workRequest.dto";

const REQUEST_COLUMNS = [
  "id",
  "slot_id",
  "closed_at",
  "expires_at",
  "request_candidates(profile_id, status, expires_at)",
  "slots!inner(id, positions, days!inner(work_date, starts_at, ends_at))",
].join(", ");

export async function getSlotRequests(
  client: DB,
  month: string,
): Promise<SlotRequest[]> {
  const { data, error } = await client
    .from("requests")
    .select(REQUEST_COLUMNS)
    .eq("kind", "work")
    .is("closed_at", null)
    .gte("slots.days.work_date", monthStart(month))
    .lt("slots.days.work_date", nextMonthStart(month))
    .returns<SlotRequest[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
