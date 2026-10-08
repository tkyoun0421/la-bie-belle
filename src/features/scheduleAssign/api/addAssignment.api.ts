import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export type AddAssignmentInput = {
  profileId: string;
  kind: string;
  slotId?: string;
  dayId?: string;
  position?: string;
  skipQualification?: boolean;
};

export async function addAssignment(
  client: DB,
  input: AddAssignmentInput,
): Promise<string> {
  const { data, error } = await client.rpc("add_assignment", {
    p_profile_id: input.profileId,
    p_kind: input.kind,
    p_slot_id: input.slotId,
    p_day_id: input.dayId,
    p_position: input.position,
    p_skip_qualification: input.skipQualification,
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
