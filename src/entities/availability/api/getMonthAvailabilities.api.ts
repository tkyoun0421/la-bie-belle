import type { DB } from "@/shared/api/database";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type { AvailabilityRow } from "@/entities/availability/api/availability.dto";
import type { Availability } from "@/entities/availability/model/availability.type";
import { toAvailability } from "@/entities/availability/utils/availability.mapper";

const AVAILABILITY_COLUMNS = [
  "profile_id",
  "work_date",
  "profiles!availabilities_profile_id_fkey(display_name)",
].join(", ");

export async function getMonthAvailabilities(
  client: DB,
  month: string,
): Promise<Availability[]> {
  const { data, error } = await client
    .from("availabilities")
    .select(AVAILABILITY_COLUMNS)
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .order("work_date")
    .returns<AvailabilityRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(toAvailability);
}
