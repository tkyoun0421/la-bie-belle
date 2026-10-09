import type { DB } from "@/shared/api/database";
import type { HallDefaults, HallSlot } from "@/entities/hall/model/hall.type";
import { toHallDefaults } from "@/entities/hall/utils/hall.mapper";

export async function getHallDefaults(client: DB): Promise<HallDefaults> {
  const { data, error } = await client
    .from("halls")
    .select("default_slots, default_starts, default_ends")
    .single();

  if (error) {
    throw error;
  }

  return toHallDefaults({
    default_slots: (data.default_slots ?? []) as HallSlot[],
    default_starts: data.default_starts,
    default_ends: data.default_ends,
  });
}
