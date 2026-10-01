import type { AttendanceStatus } from "@/entities/attendance/model/attendanceStatus";
import { summarizeAttendanceStatuses } from "@/features/attendance/model/attendanceSummary";

describe("summarizeAttendanceStatuses — 현황 줄은 0인 항목을 뺀다", () => {
  it("count가 0인 상태는 결과 객체에서 빠진다", () => {
    const statuses: (AttendanceStatus | null)[] = [
      ...Array(9).fill("present" as const),
      "late",
      "unmarked",
      null,
    ];

    const summary = summarizeAttendanceStatuses(statuses);

    expect(summary).toEqual({ present: 9, late: 1, unmarked: 1 });
  });

  it("입력이 비어 있으면 빈 객체다", () => {
    expect(summarizeAttendanceStatuses([])).toEqual({});
  });

  it("전부 상태 없음(null)이면 빈 객체다 — 인증 창이 아직 안 열린 사람들뿐이다", () => {
    expect(summarizeAttendanceStatuses([null, null])).toEqual({});
  });
});
