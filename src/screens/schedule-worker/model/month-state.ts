/**
 * 한 화면이 달의 상태를 탄다 — 같은 `/schedule`이 확정된 달에서는 근무표고 확정 전 달에서는
 * 제출 모드다(`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「확정 전 — 근무
 * 신청」). 무엇을 그릴지가 여기서 갈린다.
 *
 * **마감은 그 날 끝까지다.** 마감일 당일은 아직 접수 중이고 다음날부터 닫힌다 — 서버의
 * `submit_availability`가 쓰는 경계와 같은 값이라야 화면이 잠그지 않은 날에 서버가 거절하는
 * 일이 없다.
 *
 * **확정이 마감을 이긴다.** 확정된 달은 마감도 지나 있어 둘이 겹치는데, 확정됐다는 것이 더
 * 많은 것을 말한다.
 */

export type MonthState =
  "not_created" | "collecting" | "closed_awaiting_confirmation" | "confirmed";

export type MonthStateInput = {
  schedule: {
    applicationDeadline: string | null;
    confirmedAt: string | null;
  } | null;
  today: string;
};

export function monthState({ schedule, today }: MonthStateInput): MonthState {
  if (schedule === null) {
    return "not_created";
  }

  if (schedule.confirmedAt !== null) {
    return "confirmed";
  }

  if (
    schedule.applicationDeadline !== null &&
    schedule.applicationDeadline >= today
  ) {
    return "collecting";
  }

  return "closed_awaiting_confirmation";
}

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 오늘이다. 기기 시간대가 어디든 홀의 하루로 읽는다 — 서버의 `submit_availability`도
 * `Asia/Seoul`로 오늘을 세므로 두 곳의 경계가 같아야 한다.
 */
export function kstToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** 달 이동에 열람 제한이 없다 — 몇 해든 거슬러 가고 앞서 간다. */
export function shiftMonth(month: string, step: number): string {
  const [year, index] = month.split("-").map(Number);
  const moved = index - 1 + step;
  const movedYear = year + Math.floor(moved / 12);
  const movedIndex = ((moved % 12) + 12) % 12;

  return `${String(movedYear).padStart(4, "0")}-${String(movedIndex + 1).padStart(2, "0")}`;
}

/** 앱바 제목이다 — 「2026년 10월」. 연도가 붙는 것은 화살표로 해를 넘나드는 화면이라서다. */
export function spellMonth(month: string): string {
  const [year, index] = month.split("-").map(Number);

  return `${year}년 ${index}월`;
}

/**
 * 달력 위 마감 줄이다. 접수 중이면 남은 날을 같이 적고, 마감 뒤면 마감일만 적는다.
 *
 * 마감 당일은 남은 날이 0이라 뒤 반절을 뗀다 — 「0일 남았어요」로는 아무도 안 읽는다.
 */
export function spellDeadline(deadline: string, today: string): string {
  const [, month, day] = deadline.split("-").map(Number);
  const remaining = Math.round(
    (Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      DAY_MS,
  );

  if (remaining < 0) {
    return `스케줄 신청이 ${month}월 ${day}일에 마감됐어요`;
  }

  const weekday = WEEKDAYS[new Date(`${deadline}T00:00:00Z`).getUTCDay()];
  const head = `스케줄 신청 마감 ${month}월 ${day}일(${weekday})`;

  return remaining === 0 ? head : `${head} · ${remaining}일 남았어요`;
}
