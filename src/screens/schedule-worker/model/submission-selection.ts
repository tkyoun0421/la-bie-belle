/**
 * 제출 모드에서 고른 날짜 목록을 다룬다. 「근무 신청 체크만 즉시 칠한다」
 * (`docs/2-design/modules/schedule/design.md`의 「근무 신청 내기」)라 누르는 순간 화면이 바로
 * 바뀌고 서버에는 「보내기」가 한 번 보낸다 — 이 목록은 아직 안 보낸 로컬 상태다.
 *
 * **개수 상한이 없고 0개도 유효하다.** 다 골라도 되고, 마지막 하나를 빼서 빈 목록으로 보내는
 * 것이 이미 낸 신청을 전부 무르는 유일한 길이다.
 */
export function toggleSelectedDate(
  selected: readonly string[],
  date: string,
): string[] {
  return selected.includes(date)
    ? selected.filter((picked) => picked !== date)
    : [...selected, date];
}
