export type DayDetailRow = "hours" | "applications";

export type DayDetailRowsInput = {
  applicationCount: number;
};

export function dayDetailRows({
  applicationCount,
}: DayDetailRowsInput): DayDetailRow[] {
  return applicationCount > 0 ? ["hours", "applications"] : ["hours"];
}

export function dayApplicationsLine(names: readonly string[]): string {
  return `근무 신청 ${names.length} · ${names.join(", ")}`;
}

export function closeDayWarningLine(assignmentCount: number): string {
  return `배정 ${assignmentCount}건이 같이 사라져요`;
}
