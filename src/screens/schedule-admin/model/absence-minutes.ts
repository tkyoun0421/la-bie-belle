import {
  dayMinutes,
  type WorkDayHours,
} from "@/features/payroll/model/day-minutes";

/**
 * 결근을 고른 순간 화면이 넣는 분이다 — 그날 배정 시간만큼의 음수다
 * (`docs/2-design/modules/payroll/design.md`의 「조정」). 함수가 결근을 모르고 분만 받아서,
 * 「결근」이라는 값을 만드는 자리가 여기 하나다.
 *
 * **시:분 파싱을 새로 안 짠다.** 배정 시간을 내는 것은 급여 계산이 이미 하는 일이라
 * [`dayMinutes`](../../../features/payroll/model/day-minutes.ts)를 그대로 부른다 — 여기서 다시
 * 짜면 급여 화면과 이 시트가 다른 시간을 말한다.
 *
 * **고른 순간의 값이다.** 뒤에 근무 시간을 고쳐도 이미 선 조정 행은 안 따라간다.
 *
 * 줄 하나를 세워 넘기는 것은 `dayMinutes`가 배정 목록에서 개수만 보기 때문이다 — 그 사람의
 * 배정이 그날 하나 살아 있다는 뜻이고, 안 세우면 배정 시간이 0으로 내려온다.
 */

const ONE_ASSIGNMENT = [null];

export function assignedMinutes(day: WorkDayHours): number {
  return dayMinutes({
    assignments: ONE_ASSIGNMENT,
    day,
    adjustments: [],
    rehearsals: [],
  });
}

export function absenceMinutes(day: WorkDayHours): number {
  return -assignedMinutes(day);
}
