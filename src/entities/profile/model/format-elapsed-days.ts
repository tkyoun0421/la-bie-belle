/**
 * 보낸 시각을 「얼마나 기다렸는지」로 바꾼다. 가입 대기 목록과 차단한 사람 목록의 보조
 * 정보가 여기서 나온다 —
 * `docs/2-design/modules/account/screens/members-pending.md`의 「문안」이 정본이다.
 *
 * **시각이 아니라 달력일을 센다.** 24시간이 지났는지가 아니라 KST 자정을 몇 번 넘었는지다.
 * 어젯밤 11시에 보낸 사람은 열두 시간도 안 지났어도 「어제」다 — 관리자가 세는 것이 그 결이다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

function kstDayIndex(instant: string): number {
  return Math.floor((Date.parse(instant) + KST_OFFSET_MS) / DAY_MS);
}

export function formatElapsedDays(submittedAt: string, now: string): string {
  const days = kstDayIndex(now) - kstDayIndex(submittedAt);

  if (days <= 0) {
    return "오늘";
  }

  if (days === 1) {
    return "어제";
  }

  return `${days}일 전`;
}
