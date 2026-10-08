import type { AvailabilityRow } from "@/entities/availability/api/availability.dto";
import type { Availability } from "@/entities/availability/model/availability.type";

export function toAvailability(row: AvailabilityRow): Availability {
  return {
    profileId: row.profile_id,
    workDate: row.work_date,
    name: row.profiles?.display_name ?? null,
  };
}
