import { tallyMonthlyAttendance } from "@/entities/attendance/utils/attendanceSummary.utils";
import {
  buildAttendanceInputs,
  daysOfPerson,
  type AttendanceInputCheckIn,
  type AttendanceInputExcuseStatus,
} from "@/features/stats/utils/attendanceInputs.utils";

const DAYS = [
  {
    id: "day-1",
    workDate: "2026-09-10",
    startsAt: "10:00:00",
    endsAt: "18:00:00",
    assignments: [
      { profileId: "p1", endedAt: null },
      { profileId: "p5", endedAt: null },
      { profileId: "p2", endedAt: null },
      { profileId: "p3", endedAt: "2026-09-05T00:00:00.000Z" },
    ],
  },
  {
    id: "day-2",
    workDate: "2026-09-11",
    startsAt: "09:00:00",
    endsAt: "17:00:00",
    assignments: [{ profileId: "p4", endedAt: null }],
  },
];

const CHECK_INS: AttendanceInputCheckIn[] = [
  {
    dayId: "day-1",
    profileId: "p1",
    checkedAt: "2026-09-10T01:15:00.000Z",
    reportedAt: "2026-09-10T01:15:00.000Z",
    receivedAt: "2026-09-10T01:15:00.000Z",
  },
  {
    dayId: "day-1",
    profileId: "p5",
    checkedAt: "2026-09-10T01:05:00.000Z",
    reportedAt: "2026-09-10T01:05:00.000Z",
    receivedAt: "2026-09-10T01:05:00.000Z",
  },
  {
    dayId: "day-1",
    profileId: "p3",
    checkedAt: "2026-09-10T01:07:00.000Z",
    reportedAt: "2026-09-10T01:07:00.000Z",
    receivedAt: "2026-09-10T01:07:00.000Z",
  },
  {
    dayId: "day-2",
    profileId: "p1",
    checkedAt: "2026-09-11T00:05:00.000Z",
    reportedAt: "2026-09-11T00:05:00.000Z",
    receivedAt: "2026-09-11T00:05:00.000Z",
  },
];

const EXCUSE_STATUSES: AttendanceInputExcuseStatus[] = [
  {
    dayId: "day-2",
    profileId: "p4",
    submittedAt: "2026-09-11T09:10:00.000Z",
    decidedAt: "2026-09-11T10:00:00.000Z",
    decision: "approved",
  },
];

const NOW = "2026-09-12T10:00:00.000Z";

describe("buildAttendanceInputs — 산 배정 수만큼 입력이 생긴다", () => {
  it("ended_at이 찬 p3의 배정은 빠져 입력이 4건이다", () => {
    const inputs = buildAttendanceInputs(DAYS, CHECK_INS, EXCUSE_STATUSES, NOW);

    expect(inputs).toHaveLength(4);
  });
});

describe("buildAttendanceInputs — 그 결과를 tallyMonthlyAttendance에 먹이면 넷이 갈린다", () => {
  it("출근 1(p5)·지각 1(p1)·결근 1(p2)·출근 인정 1(p4)이다", () => {
    const inputs = buildAttendanceInputs(DAYS, CHECK_INS, EXCUSE_STATUSES, NOW);

    const tally = tallyMonthlyAttendance(inputs);

    expect(tally).toEqual({ present: 1, late: 1, absent: 1, excused: 1 });
  });

  it("출근과 출근 인정을 안 합친다 — present는 1이지 2가 아니다", () => {
    const inputs = buildAttendanceInputs(DAYS, CHECK_INS, EXCUSE_STATUSES, NOW);

    const tally = tallyMonthlyAttendance(inputs);

    expect(tally.present).toBe(1);
    expect(tally.excused).toBe(1);
  });
});

describe("buildAttendanceInputs — dayId와 profileId가 둘 다 맞아야 그 배정에 붙는다", () => {
  it("p1의 day-2 체크인 시각이 day-1 입력에 안 섞인다", () => {
    const inputs = buildAttendanceInputs(DAYS, CHECK_INS, EXCUSE_STATUSES, NOW);

    const day1CheckedAts = inputs
      .filter((input) => input.workDate === "2026-09-10")
      .map((input) => input.checkIn?.checkedAt ?? null)
      .filter((checkedAt): checkedAt is string => checkedAt !== null);

    expect(new Set(day1CheckedAts)).toEqual(
      new Set(["2026-09-10T01:15:00.000Z", "2026-09-10T01:05:00.000Z"]),
    );
  });

  it("ended_at이 찬 p3는 체크인이 있어도 그 체크인 시각이 어느 입력에도 안 붙는다", () => {
    const inputs = buildAttendanceInputs(DAYS, CHECK_INS, EXCUSE_STATUSES, NOW);

    const hasP3CheckIn = inputs.some(
      (input) => input.checkIn?.checkedAt === "2026-09-10T01:07:00.000Z",
    );

    expect(hasP3CheckIn).toBe(false);
  });
});

describe("buildAttendanceInputs — 같은 (dayId, profileId) 쌍에 소명(excuse)이 둘이면 둘 다 그 입력에 쌓인다", () => {
  it("재제출된 소명 둘이 같은 입력의 excuses에 모두 들어간다", () => {
    const days = [
      {
        id: "day-3",
        workDate: "2026-09-12",
        startsAt: "10:00:00",
        endsAt: "18:00:00",
        assignments: [{ profileId: "p6", endedAt: null }],
      },
    ];

    const excuseStatuses: AttendanceInputExcuseStatus[] = [
      {
        dayId: "day-3",
        profileId: "p6",
        submittedAt: "2026-09-12T09:00:00.000Z",
        decidedAt: null,
        decision: null,
      },
      {
        dayId: "day-3",
        profileId: "p6",
        submittedAt: "2026-09-12T09:30:00.000Z",
        decidedAt: "2026-09-12T10:00:00.000Z",
        decision: "approved",
      },
    ];

    const inputs = buildAttendanceInputs(days, [], excuseStatuses, NOW);

    expect(inputs).toHaveLength(1);
    expect(inputs[0].excuses).toHaveLength(2);
    expect(inputs[0].excuses).toEqual(expect.arrayContaining(excuseStatuses));
  });
});

describe("daysOfPerson — 그 사람 배정만 남긴다", () => {
  it("남의 배정은 그 날의 배정 목록에서 빠진다", () => {
    const mine = daysOfPerson(DAYS, "p1");

    expect(
      mine.flatMap((day) =>
        day.assignments.map((assignment) => assignment.profileId),
      ),
    ).toEqual(["p1"]);
  });

  it("날은 안 걸러진다 — 내 배정이 없는 날도 빈 목록으로 남는다", () => {
    const mine = daysOfPerson(DAYS, "p3");

    expect(mine).toHaveLength(DAYS.length);
  });

  it("profileId가 아직 없으면 날이 하나도 없다 — 좁힐 기준이 없는 순간이다", () => {
    expect(daysOfPerson(DAYS, null)).toEqual([]);
  });
});
