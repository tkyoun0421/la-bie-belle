/**
 * 인증과 사유 상태가 통신에서 오는 꼴이다. 모양을 정하는 것은 `check_ins` 표와
 * `excuse_status` 뷰라 열 이름이 DB 그대로 선다.
 */

export type CheckInRow = {
  id: string;
  day_id: string;
  profile_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
  method: string;
};

/**
 * 사유의 본문 없이 판정만 내는 뷰다 — 남의 사유 글은 관리자만 읽고, 상태 여섯을 내는 데는
 * 「냈나·판정이 났나·무엇으로 났나」 셋이면 된다.
 */
export type ExcuseStatusRow = {
  day_id: string;
  profile_id: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
};

/**
 * 날 키와 달 키가 같은 모양을 낸다 — 상태 여섯을 내는 순수 함수가 두 키 위에서 그대로
 * 돈다. 꼴이 갈리면 그 함수가 두 벌 서야 한다.
 */
export type AttendanceRows = {
  checkIns: CheckInRow[];
  excuseStatuses: ExcuseStatusRow[];
};
