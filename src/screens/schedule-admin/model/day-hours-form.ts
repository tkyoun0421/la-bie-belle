/**
 * 근무 시간 시트의 저장 버튼 활성 판정이다. 끝이 시작보다 이르거나 같으면 서버가
 * `bad_hours`로 거절하므로(`docs/2-design/spec/schedule-admin.md` AC-05) 버튼이 먼저 막는다 —
 * 벽은 서버에 있고 화면은 헛걸음을 줄인다.
 *
 * `"HH:MM"` 문자열을 그대로 비교한다. 자리 수가 고정이라 사전순이 시각순이다.
 */

export type DayHoursFormInput = {
  starts: string;
  ends: string;
};

export function isDayHoursSaveEnabled({
  starts,
  ends,
}: DayHoursFormInput): boolean {
  return ends > starts;
}

/** 날 상세의 근무 시간 줄이다 — 「근무 시간 · 10:00–19:00」. `time`의 초는 잘라 쓴다. */
export function dayHoursLine(startsAt: string, endsAt: string): string {
  return `근무 시간 · ${startsAt.slice(0, 5)}–${endsAt.slice(0, 5)}`;
}
