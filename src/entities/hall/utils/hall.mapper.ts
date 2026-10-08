import type { HallDefaultsRow } from "@/entities/hall/api/hall.dto";
import type { HallDefaults } from "@/entities/hall/model/hall.type";

export function toHallDefaults(row: HallDefaultsRow): HallDefaults {
  return {
    slots: row.default_slots,
    starts: row.default_starts,
    ends: row.default_ends,
  };
}
