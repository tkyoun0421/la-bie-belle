import {
  formatBareDate,
  formatScheduleDate,
  kstDateOf,
} from "@/screens/schedule-admin/model/format-schedule-date";

/**
 * 월 달력 머리의 마감 줄이다. 문안 표
 * (`docs/2-design/modules/schedule/screens/schedule-admin.md`의 「월 달력 문안」) 그대로
 * 마감 전이면 남은 날을, 마감 뒤면 마감일만 적는다.
 *
 * **마감 당일에 「0일 남았어요」를 안 쓴다.** 그 말은 남은 시간을 안 말한다 — 오늘이 아직
 * 안 지났다는 것이 그날 사람이 알아야 할 전부다. 근무자 달력의 같은 줄과 같은 손이다.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type DeadlineLineInput = {
  applicationDeadline: string;
  now: string;
};

export function deadlineLine({
  applicationDeadline,
  now,
}: DeadlineLineInput): string {
  const remaining = Math.round(
    (Date.parse(`${applicationDeadline}T00:00:00Z`) -
      Date.parse(`${kstDateOf(now)}T00:00:00Z`)) /
      DAY_MS,
  );

  if (remaining < 0) {
    return `스케줄 신청이 ${formatBareDate(applicationDeadline)}에 마감됐어요`;
  }

  const left = remaining === 0 ? "오늘까지예요" : `${remaining}일 남았어요`;

  return `스케줄 신청 마감 ${formatScheduleDate(applicationDeadline)} · ${left}`;
}
