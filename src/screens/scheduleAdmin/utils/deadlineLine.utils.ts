import { kstDateOf } from "@/shared/utils/kstDate";
import {
  formatBareDate,
  formatScheduleDate,
} from "@/entities/schedule/utils/formatScheduleDate.utils";

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
