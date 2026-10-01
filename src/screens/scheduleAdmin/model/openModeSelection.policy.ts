import {
  formatBareDate,
  kstDateOf,
} from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";

/**
 * 날 열기 모드의 셈이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「날 열기 모드 짜임」과
 * 「날 열기 모드 문안」이다.
 *
 * **고를 수 있는 칸은 안 연 날 중 오늘부터다.** 지난 날을 열면 그 배정이 급여 계산을 바로
 * 건드려서 그 길을 안 냈고(SCH-002), 오늘 당일은 아직 열 수 있는 날이다.
 *
 * **버튼 라벨이 왜 안 눌리는지를 말한다.** 0개면 「열 날을 고르세요」이고 고르면 수를 센다.
 */

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

/**
 * 여러 날을 한 번에 열다 하나가 실패했을 때의 토스트다. 나머지는 열렸고 모드는 안 풀린다 —
 * 문안 표의 「날 열기 부분 실패 토스트」 행 그대로 요일 괄호가 없다.
 *
 * 실패가 없으면 `null`이다. 부르는 쪽이 「전부 성공」을 따로 안 세게 한다.
 */
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
