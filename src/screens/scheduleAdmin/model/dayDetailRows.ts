/**
 * 날 상세 머리에 서는 줄들이다. 이 task가 그리는 것은 껍데기까지라 근무 시간 줄과 근무 신청
 * 줄 둘뿐이다(`docs/3-build/plans/schedule-admin.md` AC-06).
 *
 * **임시공휴일 줄과 근무 조정 줄은 여기 없다.** 값이 `holidays`와 `adjustments`로 가는
 * payroll의 것이고 그 표가 아직 없다. 자리만 비워두는 대신 줄 자체를 안 그린다 — 누를 것이
 * 없는 스위치를 세우면 켜지는 줄 알고 누른다. `payroll-adjust`가 둘을 통째로 더한다.
 *
 * **근무 신청이 0건이면 줄이 통째로 없다.** 「0명 신청」을 적으면 읽을 것이 있는 줄처럼
 * 보인다(`docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 신청 0건」).
 */

export type DayDetailRow = "hours" | "applications";

export type DayDetailRowsInput = {
  applicationCount: number;
};

export function dayDetailRows({
  applicationCount,
}: DayDetailRowsInput): DayDetailRow[] {
  return applicationCount > 0 ? ["hours", "applications"] : ["hours"];
}

/** 근무 신청 줄이다 — 「근무 신청 2 · 박서연, 김지우」. 이름에 「님」이 없다. */
export function dayApplicationsLine(names: readonly string[]): string {
  return `근무 신청 ${names.length} · ${names.join(", ")}`;
}

/** 날 닫기 경고 시트의 아래 줄이다 — 몇 건이 같이 사라지는지 센다(SCH-004). */
export function closeDayWarningLine(assignmentCount: number): string {
  return `배정 ${assignmentCount}건이 같이 사라져요`;
}
