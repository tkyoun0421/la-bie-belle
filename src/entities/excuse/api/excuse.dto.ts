/**
 * 사유 한 건이 통신에서 오는 꼴이다. 본인이 제 사유를 읽는 자리라 본문과 판정 사유까지
 * 같이 온다 — 상태만 내는 [`excuse_status` 뷰](../../attendance/api/attendance.dto.ts)와
 * 갈리는 자리다.
 */
export type ExcuseRow = {
  id: string;
  day_id: string;
  profile_id: string;
  body: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
  decision_reason: string | null;
};
