/**
 * 홀의 하루를 읽는 손이다. 기기 시간대가 어디든 `Asia/Seoul` 자정으로 날을 가른다 — 서버의
 * `submit_availability`도 같은 경계를 쓰므로 두 곳이 어긋나면 화면이 안 잠근 날에 서버가
 * 거절한다.
 *
 * **슬라이스 넷에 같은 손이 각자 서 있던 것을 여기로 모았다.** 근무표·관리자 근무표·관리자
 * 홈·근무 신청이 같은 계산을 네 벌 들고 있었고 리허설이 다섯째였다. 슬라이스끼리는 서로를
 * 못 부르니(lint 규칙 3) 공용 자리가 여기다 — 넷은 제 이름을 그대로 두고 이 파일에 위임한다.
 *
 * **달력 날짜와 시각을 갈라 읽는다.** `work_date`는 시각 없는 KST 달력 날짜라 UTC 자정으로
 * 읽어야 기기 시간대가 어디든 같은 요일이 나오고, 타임스탬프는 `Asia/Seoul`로 옮겨야 달력
 * 날짜가 맞는다 — UTC로 읽으면 밤 9시 뒤가 하루 전으로 선다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const KST_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 그 순간이 KST로 며칠인지다 — `"2026-10-03"`. */
export function kstDateOf(instant: string | Date): string {
  return KST_DATE.format(instant instanceof Date ? instant : new Date(instant));
}

/** 날짜에서 그 달을 뗀다 — `"2026-10-10"`은 `"2026-10"`이다. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** 달 이동에 열람 제한이 없다 — 몇 해든 거슬러 가고 앞서 간다. */
export function shiftMonth(month: string, step: number): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const moved = index - 1 + step;
  const movedYear = year + Math.floor(moved / 12);
  const movedIndex = ((moved % 12) + 12) % 12;

  return `${String(movedYear).padStart(4, "0")}-${String(movedIndex + 1).padStart(2, "0")}`;
}

/** 앱바 제목이다 — `"2026년 10월"`. 연도가 붙는 것은 화살표로 해를 넘나드는 화면이라서다. */
export function spellMonth(month: string): string {
  return `${Number(month.slice(0, 4))}년 ${Number(month.slice(5, 7))}월`;
}

/** 그 달의 마지막 날이다 — `"2026-10"`은 `"2026-10-31"`이다. */
export function lastDateOfMonth(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const last = new Date(Date.UTC(year, index, 0));

  return [
    String(last.getUTCFullYear()).padStart(4, "0"),
    String(last.getUTCMonth() + 1).padStart(2, "0"),
    String(last.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/** 날짜를 요일까지 읽는다 — `"10월 10일(토)"`. */
export function spellDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

  return `${month}월 ${day}일(${weekday})`;
}
