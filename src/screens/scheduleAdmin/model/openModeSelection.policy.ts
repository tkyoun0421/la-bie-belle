import { kstDateOf } from "@/shared/utils/kstDate";
import { formatBareDate } from "@/entities/schedule/utils/formatScheduleDate.utils";

export type SelectableInput = {
  workDate: string;
  isOpen: boolean;
  now: string;
};

export function isSelectableForOpening({
  workDate,
  isOpen,
  now,
}: SelectableInput): boolean {
  return !isOpen && workDate >= kstDateOf(now);
}

export function openDaysButtonLabel(count: number): string {
  return count === 0 ? "열 날을 고르세요" : `${count}일 열기`;
}

export function openDaysFailureToast(failedDates: string[]): string | null {
  const [first, ...rest] = [...failedDates].sort();

  if (first === undefined) {
    return null;
  }

  const subject =
    rest.length === 0
      ? formatBareDate(first)
      : `${formatBareDate(first)} 외 ${rest.length}일`;

  return `${subject}은 열지 못했어요`;
}
