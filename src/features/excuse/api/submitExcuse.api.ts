import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { SubmitExcuseParams } from "@/features/excuse/model/excuse.type";

export async function submitExcuse(
  client: DB,
  params: SubmitExcuseParams,
): Promise<void> {
  const { error } = await client.rpc("submit_excuse", {
    p_day_id: params.dayId,
    p_body: params.body,
  });

  if (error) {
    throw toApiError(error);
  }
}
