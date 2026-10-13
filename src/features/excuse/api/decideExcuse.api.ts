import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { DecideExcuseParams } from "@/features/excuse/model/excuse.type";

export async function decideExcuse(
  client: DB,
  params: DecideExcuseParams,
): Promise<void> {
  const { error } = await client.rpc("decide_excuse", {
    p_excuse_id: params.excuseId,
    p_approved: params.approved,
    p_reason: params.reason ?? undefined,
  });

  if (error) {
    throw toApiError(error);
  }
}
