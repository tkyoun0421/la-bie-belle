import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 확정 뒤 한 자리의 사람을 바꾼다. 옛 배정을 닫고 새 배정을 여는 **한 트랜잭션**이다
 * (`docs/2-design/modules/schedule/design.md`의 「배정과 강제 변경」) — 빼기만 되고 넣기가
 * 실패하면 자리가 빈 채로 남고 알림도 반쪽이 된다.
 *
 * 새 사람에게 `add_assignment`와 같은 검사가 그대로 걸린다 — 신청 안 했으면 `not_applied`,
 * 자격이 없으면 `not_qualified`, 그날 이미 들었으면 `already_assigned`. 실패하면 옛 배정은
 * 손대기 전 그대로다.
 *
 * 낸 값은 새 배정의 id다.
 */
export async function forceChange(
  client: Db,
  assignmentId: string,
  profileId: string,
): Promise<string> {
  const { data, error } = await client.rpc("force_change", {
    p_assignment_id: assignmentId,
    p_profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
