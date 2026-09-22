import {
  getAttendanceStatus,
  type AttendanceStatus,
  type AttendanceStatusInput,
} from "@/features/attendance/model/attendance-status";
import {
  summarizeAttendanceStatuses,
  tallyMonthlyAttendance,
} from "@/features/attendance/model/attendance-summary";

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

describe("tallyMonthlyAttendance — 근태 월 집계는 getAttendanceStatus와 같은 판정을 쓴다(ATT-023)", () => {
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
