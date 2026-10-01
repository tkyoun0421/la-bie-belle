import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export type DecideExcuseParams = {
  excuseId: string;
  approved: boolean;
  reason: string | null;
};

export async function decideExcuse(
  client: Db,
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
