import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 리허설 한 줄을 넣는다. **갈래를 함수가 다시 판정한다** — 화면이 보낸 시각이나 건수를
 * 안 믿고 그날 살아 있는 정규 배정으로 다시 정한다
 * (`docs/2-design/modules/schedule/design.md`의 「리허설 넣기·고치기·지우기」).
 *
 * 거절은 검사 순서 그대로다 — 승인 안 됐으면 `not_allowed` → 자격이 없으면 `not_qualified`
 * → 갈래가 어긋나면 `wrong_kind` → 값이 범위 밖이면 `bad_hours`·`bad_count` → 시각이
 * 겹치면 `overlaps` / 건수 줄이 이미 있으면 `already_exists`.
 */

export type AddRehearsalInput = {
  workDate: string;
  startsAt?: string;
  endsAt?: string;
  count?: number;
};

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
