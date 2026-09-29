// 구현 대상: src/entities/attendance/model/attendance-summary.ts (아직 없다)
//
// tallyMonthlyAttendance는 지금 features/attendance/model/attendance-summary.ts에
// 산다. features/stats/model/__tests__/attendance-inputs.test.ts가 이것을 부르려고
// house/no-cross-slice-import 억제 주석을 달고 features/stats에서 features/attendance를
// 직접 불렀다(같은 층 다른 슬라이스, lint 규칙 3 위반).
//
// payroll-data plan이 attendance-status.ts·rehearsal-hours.ts에 쓴 전례를 따라
// 이 함수를 entities/attendance/model/로 내린다 — 결근 판정이 이미 이 자리
// (attendance-status.ts)의 규칙이고, features/stats·screens/admin-stats 양쪽 다
// entities는 슬라이스 제한 없이 부를 수 있다. 옮기는 것은 자리뿐이고 함수와
// 단언은 features/attendance/model/__tests__/attendance-summary.test.ts의
// tallyMonthlyAttendance 몫과 같다.

import {
  getAttendanceStatus,
  type AttendanceStatusInput,
} from "@/entities/attendance/model/attendance-status";
import {
  attendanceRate,
  tallyMonthlyAttendance,
  type MonthlyAttendanceTally,
} from "@/entities/attendance/model/attendance-summary";

function buildDay(
  overrides: Partial<AttendanceStatusInput> = {},
): AttendanceStatusInput {
  return {
    workDate: "2026-09-10",
    startsAt: "10:00:00",
    endsAt: "19:00:00",
    checkIn: null,
    excuses: [],
    now: "2026-09-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("tallyMonthlyAttendance — entities로 내려와도 getAttendanceStatus와 같은 판정을 쓴다(ATT-023)", () => {
  it("출근·지각·결근·출근 인정 넷만 센다 — 확인 중과 안 찍음은 어디에도 안 든다", () => {
    const days: AttendanceStatusInput[] = [
      buildDay({
        now: "2026-09-10T01:00:00.000Z",
        checkIn: {
          checkedAt: "2026-09-10T01:00:00.000Z",
          reportedAt: "2026-09-10T01:00:00.000Z",
          receivedAt: "2026-09-10T01:00:00.000Z",
        },
      }),
      buildDay({
        workDate: "2026-09-11",
        now: "2026-09-11T01:20:00.000Z",
        checkIn: {
          checkedAt: "2026-09-11T01:20:00.000Z",
          reportedAt: "2026-09-11T01:20:00.000Z",
          receivedAt: "2026-09-11T01:20:00.000Z",
        },
      }),
      buildDay({
        workDate: "2026-09-12",
        now: "2026-09-14T10:00:01.000Z",
        excuses: [],
      }),
      buildDay({
        workDate: "2026-09-13",
        now: "2026-09-15T10:00:01.000Z",
        excuses: [
          {
            submittedAt: "2026-09-13T10:00:00.000Z",
            decidedAt: "2026-09-13T12:00:00.000Z",
            decision: "approved",
          },
        ],
      }),
      buildDay({
        workDate: "2026-09-14",
        now: "2026-09-14T00:00:00.000Z",
        excuses: [
          {
            submittedAt: "2026-09-14T10:00:00.000Z",
            decidedAt: null,
            decision: null,
          },
        ],
      }),
      buildDay({
        workDate: "2026-09-15",
        now: "2026-09-15T00:00:00.000Z",
      }),
    ];

    const tally = tallyMonthlyAttendance(days);

    expect(tally).toEqual({ present: 1, late: 1, absent: 1, excused: 1 });
  });

  it("출근 인정은 출근과 따로 센다(ATT-026) — 인정된 날은 present를 안 올린다", () => {
    const excusedDay = buildDay({
      now: "2026-09-15T00:00:00.000Z",
      excuses: [
        {
          submittedAt: "2026-09-10T10:00:00.000Z",
          decidedAt: "2026-09-10T12:00:00.000Z",
          decision: "approved",
        },
      ],
    });

    const tally = tallyMonthlyAttendance([excusedDay]);

    expect(tally).toEqual({ present: 0, late: 0, absent: 0, excused: 1 });
  });

  it("하루치 입력을 getAttendanceStatus에 그대로 넣은 결과와 월 집계가 어긋나지 않는다", () => {
    const day = buildDay({
      now: "2026-09-10T01:10:01.000Z",
      checkIn: {
        checkedAt: "2026-09-10T01:10:01.000Z",
        reportedAt: "2026-09-10T01:10:01.000Z",
        receivedAt: "2026-09-10T01:10:01.000Z",
      },
    });

    const status = getAttendanceStatus(day);
    const tally = tallyMonthlyAttendance([day]);

    expect(status).toBe("late");
    expect(tally).toEqual({ present: 0, late: 1, absent: 0, excused: 0 });
  });
});

describe("attendanceRate — screens/admin-stats/chart-values.ts에서 내려와 tally 하나만 받는다(stats.md 「추이 그래프」)", () => {
  it("출근·지각·결근·출근 인정의 합이 분모고 출근 인정은 분모에만 든다", () => {
    const tally: MonthlyAttendanceTally = {
      present: 6,
      late: 1,
      absent: 1,
      excused: 2,
    };

    expect(attendanceRate(tally)).toBe(60);
  });

  it("넷이 다 0이면 null이다 — 그 달은 점을 안 찍는다", () => {
    const tally: MonthlyAttendanceTally = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    };

    expect(attendanceRate(tally)).toBeNull();
  });

  it("AttendanceTab(screens 타입)이 아니라 tally를 직접 받는다 — tally 자체가 없어도 null이다", () => {
    expect(attendanceRate(undefined)).toBeNull();
  });

  it("tallyMonthlyAttendance가 낸 값을 그대로 넣어도 같은 공식으로 셈한다", () => {
    const day = buildDay({
      now: "2026-09-10T01:00:00.000Z",
      checkIn: {
        checkedAt: "2026-09-10T01:00:00.000Z",
        reportedAt: "2026-09-10T01:00:00.000Z",
        receivedAt: "2026-09-10T01:00:00.000Z",
      },
    });

    const tally = tallyMonthlyAttendance([day]);

    expect(attendanceRate(tally)).toBe(100);
  });
});
