import type { Db } from "@/shared/api/database";

/**
 * 아직 판정 안 된 근무 취소 요청들이다. `/admin/approvals`의 목록이고 관리자 홈의
 * 「승인할 일」 건수도 이 길이다([approvals.md](../../../../docs/2-design/system/screens/approvals.md)).
 *
 * **판정된 것은 안 온다.** 끝난 건을 보는 화면이 없어서 그대로 목록에서 사라진다 —
 * 결과는 근무표의 빈 자리와 근무자가 받은 알림에 남는다.
 *
 * **사유(출근 인증) 줄은 아직 없다.** 같은 목록에 섞이는 자리는 `attendance-excuse`가
 * 잇는다(plan 「범위 밖」).
 *
 * 관리자가 아니면 RLS가 자기 것만 돌려준다 — 목록이 비는 것으로 권한이 드러난다.
 *
 * 보내는 사람을 `cancel_requests_profile_id_fkey`로 집는 것은 이 표가 `profiles`를 두 번
 * 가리키기 때문이다 — 낸 사람과 판정한 사람이다.
 */

export type PendingApproval = {
  id: string;
  assignment_id: string;
  reason: string;
  created_at: string;
  assignments: {
    day_id: string;
    position: string;
    days: { work_date: string; starts_at: string; ends_at: string };
  };
  profiles: { display_name: string | null; photo_url: string | null };
};

const APPROVAL_COLUMNS = [
  "id",
  "assignment_id",
  "reason",
  "created_at",
  "assignments!inner(day_id, position, days!inner(work_date, starts_at, ends_at))",
  "profiles!cancel_requests_profile_id_fkey(display_name, photo_url)",
].join(", ");

export async function getPendingApprovals(
  client: Db,
): Promise<PendingApproval[]> {
  const { data, error } = await client
    .from("cancel_requests")
    .select(APPROVAL_COLUMNS)
    .is("decided_at", null)
    .order("created_at")
    .returns<PendingApproval[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
