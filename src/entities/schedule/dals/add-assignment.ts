import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 사람을 자리에 넣는다. 정규와 교육이 같은 함수 하나로 간다
 * (`docs/2-design/modules/schedule/design.md`의 「배정과 강제 변경」) — 정규는 `slotId`로
 * 날과 포지션을 읽고, 교육은 자리를 안 먹어 `dayId`·`position`을 받는다.
 *
 * **갈래와 인자를 함수가 다시 본다.** 화면이 보내온 갈래를 믿지 않고 어긋나면 `wrong_kind`다.
 *
 * `skipQualification`이 「이번만 넣기」다. 자격 검사 하나만 건너뛰고 나머지 셋은 그대로
 * 걸린다 — 기본값이 `false`라 자격 시트에서만 열린다.
 *
 * 거절은 검사 순서 그대로다 — `not_allowed` → `wrong_kind` → 그날 신청이 없으면
 * `not_applied` → 제한 포지션 자격이 없으면 `not_qualified` → 그날 이미 정규로 든 사람이면
 * `already_assigned` → 자리가 찼으면 `slot_full`.
 */

export type AddAssignmentInput = {
  profileId: string;
  kind: string;
  slotId?: string;
  dayId?: string;
  position?: string;
  skipQualification?: boolean;
};

export async function addAssignment(
  client: Db,
  input: AddAssignmentInput,
): Promise<string> {
  const { data, error } = await client.rpc("add_assignment", {
    p_profile_id: input.profileId,
    p_kind: input.kind,
    p_slot_id: input.slotId,
    p_day_id: input.dayId,
    p_position: input.position,
    p_skip_qualification: input.skipQualification,
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
