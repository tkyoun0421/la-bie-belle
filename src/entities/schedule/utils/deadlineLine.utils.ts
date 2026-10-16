import { daysUntil, formatBareDate, kstDateOf } from "@/shared/utils/kstDate";
import { formatScheduleDate } from "@/entities/schedule/utils/formatScheduleDate.utils";

export type DeadlineLineInput = {
  applicationDeadline: string;
  now: string;
};

export function deadlineLine({
  applicationDeadline,
  now,
}: DeadlineLineInput): string {
  const remaining = daysUntil(kstDateOf(now), applicationDeadline);

  if (remaining < 0) {
    return `스케줄 신청이 ${formatBareDate(applicationDeadline)}에 마감됐어요`;
  }

  const left = remaining === 0 ? "오늘까지예요" : `${remaining}일 남았어요`;

  return `스케줄 신청 마감 ${formatScheduleDate(applicationDeadline)} · ${left}`;
}
