import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export type SetWageInput = {
  profileId: string;
  amount: number;
};

export async function setWage(client: DB, input: SetWageInput): Promise<void> {
  const { error } = await client.rpc("set_wage", {
    p_profile_id: input.profileId,
    p_amount: input.amount,
  });

  if (error) {
    throw toApiError(error);
  }
}
