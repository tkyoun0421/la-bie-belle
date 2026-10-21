import type { DB } from "@/shared/api/database";
import { readAllPages } from "@/shared/api/readAllPages";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type { AvailabilityRow } from "@/entities/availability/api/availability.dto";
import type { Availability } from "@/entities/availability/model/availability.type";
import { toAvailability } from "@/entities/availability/utils/availability.mapper";

const AVAILABILITY_COLUMNS = [
  "id",
  "profile_id",
  "work_date",
  "profiles!availabilities_profile_id_fkey(display_name)",
].join(", ");

type KeyedAvailabilityRow = AvailabilityRow & { id: string };

function byDateThenProfile(
  left: AvailabilityRow,
  right: AvailabilityRow,
): number {
  const leftKey = `${left.work_date}|${left.profile_id}`;
  const rightKey = `${right.work_date}|${right.profile_id}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

export async function getMonthAvailabilities(
  client: DB,
  month: string,
): Promise<Availability[]> {
  const rows = await readAllPages(
    (after: string | null, limit) => {
      const query = client
        .from("availabilities")
        .select(AVAILABILITY_COLUMNS)
        .gte("work_date", monthStart(month))
        .lt("work_date", nextMonthStart(month));
      return (after === null ? query : query.gt("id", after))
        .order("id")
        .limit(limit)
        .returns<KeyedAvailabilityRow[]>();
    },
    (row) => row.id,
  );

  return rows.sort(byDateThenProfile).map(toAvailability);
}
