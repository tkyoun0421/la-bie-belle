import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { SetHolidayInput } from "@/features/holiday/model/holiday.type";

export async function setHoliday(
  client: DB,
  input: SetHolidayInput,
): Promise<void> {
  const { error } = await client.rpc("set_holiday", {
    p_date: input.date,
    p_on: input.on,
  });

  if (error) {
    throw toApiError(error);
  }
}
