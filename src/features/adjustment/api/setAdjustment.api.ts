import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export type SetAdjustmentInput = {
  dayId: string;
  profileId: string;
  minutes: number;
  reason: string;
};

export async function setAdjustment(
  client: DB,
  input: SetAdjustmentInput,
): Promise<void> {
  const { error } = await client.rpc("set_adjustment", {
    p_day_id: input.dayId,
    p_profile_id: input.profileId,
    p_minutes: input.minutes,
    p_reason: input.reason,
  });

  if (error) {
    throw toApiError(error);
  }
}
