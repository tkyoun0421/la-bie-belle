import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import { monthStart } from "@/shared/utils/monthRange";

export async function confirmSchedule(
  client: DB,
  month: string,
): Promise<void> {
  const { error } = await client.rpc("confirm_schedule", {
    p_month: monthStart(month),
  });

  if (error) {
    throw toApiError(error);
  }
}
