/**
 * 관리자 근무표의 날짜 표기다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「표기」와 「확정 뒤 문안」이다.
 *
 * **달력 날짜와 시각을 갈라 읽는다.** `work_date`는 시각 없는 KST 달력 날짜라 UTC 자정으로
 * 읽어야 기기 시간대가 어디든 같은 요일이 나온다. `confirmed_at`은 실제 타임스탬프라
 * `Asia/Seoul`로 옮겨야 달력 날짜가 맞는다 — UTC로 읽으면 밤 9시 뒤 확정이 하루 전으로 선다.
 *
 * 이 슬라이스의 「오늘」도 여기서 난다. 서버 시각을 `now`로 주입받아 KST 달력 날짜로
 * 옮기는 손이 하나라야 확정 잠김·열기 가능·전부 지난 달의 경계가 한 자정에서 같이 움직인다
 * (`docs/2-design/system/runtime.md`의 「TanStack Query 규칙」).
 */

import { kstDateOf, spellDate, spellMonth } from "@/shared/lib/kstDate";

/**
 * 날짜 손 셋의 소유자는 `@/shared/lib/kstDate`다. 같은 계산이 슬라이스 넷에 각자 서 있던
 * 것을 거기로 모았고, 이 슬라이스가 부르는 이름은 그대로 두고 위임만 한다.
 */
export { kstDateOf };

/** `"10월 10일(토)"`다. */
export function formatScheduleDate(workDate: string): string {
  return spellDate(workDate);
}

/** `"10월 10일"`이다 — 날 닫기 경고와 날 열기 실패 토스트가 요일을 안 붙인다. */
export function formatBareDate(workDate: string): string {
  const [, month, day] = workDate.split("-").map(Number);

  return `${month}월 ${day}일`;
}

/** 문안이 부르는 달 이름이다 — `"10월"`. */
export function formatMonthName(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

/**
 * 앱바 제목이다 — `"2026년 10월"`. 연도가 붙는 것은 화살표로 해를 넘나드는 화면이라서고,
 * 근무자 달력의 앱바와 같은 꼴이다. 두 벌이던 그 계산은 `@/shared/lib/kstDate`로 합쳤다.
 */
export function formatMonthTitle(month: string): string {
  return spellMonth(month);
}

export type ConfirmedLineInput = {
  confirmedAt: string;
  notifiedCount: number;
};

/** 확정 뒤 달력 머리에 남는 한 줄이다. 시트는 닫히고 이 줄이 남는다. */
export function confirmedLine({
  confirmedAt,
  notifiedCount,
}: ConfirmedLineInput): string {
  return `${formatBareDate(kstDateOf(confirmedAt))}에 확정했어요 · ${notifiedCount}명에게 알림을 보냈어요`;
}
