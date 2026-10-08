import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function setDefaultWage(
  client: DB,
  amount: number,
): Promise<void> {
  const { error } = await client.rpc("set_default_wage", { p_amount: amount });

  if (error) {
    throw toApiError(error);
  }
}
