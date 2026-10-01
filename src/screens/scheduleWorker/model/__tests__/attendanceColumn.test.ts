import type { AttendanceStatusInput } from "@/entities/attendance/model/attendanceStatus";
import type { AttendanceSummary } from "@/features/attendance/model/attendanceSummary";
import {
  attendanceSummaryLine,
  isAttendanceColumnVisible,
} from "@/screens/schedule-worker/model/attendanceColumn";

const BASE_INPUT: AttendanceStatusInput = {
  workDate: "2026-10-10",
  startsAt: "10:00:00",
  endsAt: "18:00:00",
  checkIn: null,
  excuses: [],
  now: "2026-10-10T09:00:00+09:00",
};

describe("isAttendanceColumnVisible — 인증 창이 열리기 전에는 상태 열이 통째로 없다", () => {
  it("근무 시작 한 시간 전, 그 경계 순간부터 보인다", () => {
    const visible = isAttendanceColumnVisible({
      ...BASE_INPUT,
      now: "2026-10-10T09:00:00+09:00",
    });

    expect(visible).toBe(true);
  });

  it("경계 1분 전에는 아직 안 보인다", () => {
    const visible = isAttendanceColumnVisible({
      ...BASE_INPUT,
      now: "2026-10-10T08:59:00+09:00",
    });

    expect(visible).toBe(false);
  });
});

describe("attendanceSummaryLine — 출근 수가 앞에 서고 0인 항목은 뺀다", () => {
  it("문서 예시 그대로 조립한다", () => {
    const summary: AttendanceSummary = { present: 9, late: 1, unmarked: 1 };

    const line = attendanceSummaryLine(summary, 11);

    expect(line).toBe("11명 중 9명 출근 · 지각 1 · 아직 1");
  });

  it("0인 항목은 문구에서 빠진다", () => {
    const summary: AttendanceSummary = { present: 10, absent: 1 };

    const line = attendanceSummaryLine(summary, 11);

    expect(line).toBe("11명 중 10명 출근 · 결근 1");
  });

  it("전원이 제때 찍었으면 전원 출근 한 마디다", () => {
    const summary: AttendanceSummary = { present: 11 };

    const line = attendanceSummaryLine(summary, 11);

    expect(line).toBe("11명 전원 출근");
  });

  it("남은 다섯이 여럿이면 문안 표의 차례를 지킨다", () => {
    const summary: AttendanceSummary = {
      present: 7,
      absent: 1,
      late: 1,
      excused: 1,
      pending: 1,
    };

    const line = attendanceSummaryLine(summary, 11);

    expect(line).toBe(
      "11명 중 7명 출근 · 지각 1 · 확인 중 1 · 출근 인정 1 · 결근 1",
    );
  });
});
