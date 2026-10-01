/**
 * 한 화면이 달의 상태를 탄다 — 같은 `/schedule`이 확정된 달에서는 근무표고 확정 전 달에서는
 * 제출 모드다(`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「확정 전 — 근무
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
 * 오늘과 달 이동과 앱바 제목은 `@/shared/utils/kstDate`가 소유한다. 같은 손이 슬라이스 넷에
 * 각자 서 있던 것을 거기로 모았고, 부르는 쪽이 안 바뀌게 이름만 여기서 이어 낸다.
 */
export { shiftMonth, spellMonth } from "@/shared/utils/kstDate";

/**
 * 달력 위 마감 줄이다. 문안 표의 세 행 그대로다 — 마감 전이면 남은 날을, 마감 당일이면
 * 「오늘까지예요」를, 마감 뒤면 마감일만 적는다.
 *
 * 마감 당일에 「0일 남았어요」를 안 쓰는 것은 그 말이 남은 시간을 안 말하기 때문이다 — 오늘이
 * 아직 안 지났다는 것이 그날 사람이 알아야 할 전부다.
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
  const left = remaining === 0 ? "오늘까지예요" : `${remaining}일 남았어요`;

  return `스케줄 신청 마감 ${month}월 ${day}일(${weekday}) · ${left}`;
}
