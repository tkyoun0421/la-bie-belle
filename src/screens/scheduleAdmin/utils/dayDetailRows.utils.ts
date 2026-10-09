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
