import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { HallSlot } from "@/entities/hall/model/hall.type";

export type HallDefaultsInput = {
  slots: HallSlot[];
  starts: string;
  ends: string;
};

export async function setHallDefaults(
  client: DB,
  { slots, starts, ends }: HallDefaultsInput,
): Promise<void> {
  const { error } = await client.rpc("set_hall_defaults", {
    p_slots: slots,
    p_starts: starts,
    p_ends: ends,
  });

  if (error) {
    throw toApiError(error);
  }
}
