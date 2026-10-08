import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function submitAvailability(
  client: DB,
  month: string,
  dates: string[],
): Promise<void> {
  const { error } = await client.rpc("submit_availability", {
    p_month: `${month}-01`,
    p_dates: dates,
  });

  if (error) {
    throw toApiError(error);
  }
}
