import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { AddRehearsalInput } from "@/features/rehearsalEdit/model/rehearsalEdit.type";

export async function addRehearsal(
  client: DB,
  input: AddRehearsalInput,
): Promise<void> {
  const { error } = await client.rpc("add_rehearsal", {
    p_work_date: input.workDate,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_count: input.count,
  });

  if (error) {
    throw toApiError(error);
  }
}
