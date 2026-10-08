import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function openDay(client: DB, workDate: string): Promise<void> {
  const { error } = await client.rpc("open_day", { p_work_date: workDate });

  if (error) {
    throw toApiError(error);
  }
}
