import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { RequestAnswer } from "@/entities/workRequest/model/workRequest.type";

export async function respondRequest(
  client: DB,
  requestId: string,
  answer: RequestAnswer,
): Promise<string | null> {
  const { data, error } = await client.rpc("respond_request", {
    p_request_id: requestId,
    p_answer: answer,
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
