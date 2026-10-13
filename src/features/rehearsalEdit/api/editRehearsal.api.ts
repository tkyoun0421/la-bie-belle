import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { EditRehearsalInput } from "@/features/rehearsalEdit/model/rehearsalEdit.type";

export async function editRehearsal(
  client: DB,
  input: EditRehearsalInput,
): Promise<void> {
  const { error } = await client.rpc("edit_rehearsal", {
    p_id: input.id,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_count: input.count,
  });

  if (error) {
    throw toApiError(error);
  }
}
