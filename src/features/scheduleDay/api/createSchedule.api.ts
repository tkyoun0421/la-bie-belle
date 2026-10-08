import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import { monthStart } from "@/shared/utils/monthRange";

export async function createSchedule(
  client: DB,
  month: string,
  deadline: string,
): Promise<void> {
  const { error } = await client.rpc("create_schedule", {
    p_month: monthStart(month),
    p_deadline: deadline,
  });

  if (error) {
    throw toApiError(error);
  }
}
