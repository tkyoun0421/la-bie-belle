import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance.type";
import { monthAttendanceLine } from "@/features/stats/utils/monthAttendanceLine.utils";

describe("monthAttendanceLine — 출근·지각·출근 인정·결근 순서로 한 줄을 낸다", () => {
  it("넷이 모두 값이 있으면 '출근 41 · 지각 4 · 출근 인정 2 · 결근 1'이다", () => {
    const tally: MonthlyAttendanceTally = {
      present: 41,
      late: 4,
      excused: 2,
      absent: 1,
    };

    expect(monthAttendanceLine(tally)).toBe(
      "출근 41 · 지각 4 · 출근 인정 2 · 결근 1",
    );
  });
});

describe("monthAttendanceLine — 0인 몫도 안 빠진다(비율 띠 범례와 다른 자리다)", () => {
  it("지각·출근 인정·결근이 모두 0이어도 넷 다 그대로 선다", () => {
    const tally: MonthlyAttendanceTally = {
      present: 10,
      late: 0,
      excused: 0,
      absent: 0,
    };

    expect(monthAttendanceLine(tally)).toBe(
      "출근 10 · 지각 0 · 출근 인정 0 · 결근 0",
    );
  });
});
