import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 이미 선 줄의 값을 고친다. **갈래를 다시 판정하지 않는다** — 그 행이 이미 든 갈래 안에서만
 * 값이 바뀌고, 다른 갈래 인자가 오면 `wrong_kind`다
 * (`docs/2-design/modules/schedule/design.md`의 「리허설 넣기·고치기·지우기」).
 *
 * 남의 행이면 `not_allowed`고 관리자에게도 남의 행을 쓰는 길이 없다.
 */

export type EditRehearsalInput = {
  id: string;
  startsAt?: string;
  endsAt?: string;
  count?: number;
};

export async function editRehearsal(
  client: Db,
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
