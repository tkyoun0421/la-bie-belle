// 구현 대상: src/features/stats/utils/attendanceInputs.utils.ts
//
// buildAttendanceInputs(days, checkIns, excuseStatuses, now) — 그달 배정·날
// 시각과 checkIns·excuseStatuses를 (day_id, profile_id)로 맞물려
// AttendanceStatusInput[]을 낸다(착수 판정 「근태 월 집계의 입력을 만드는 자리」).
// 세는 것은 tallyMonthlyAttendance(entities/attendance/model/attendanceSummary)
// 고 여기서 다시 짜지 않는다 — 이 파일은 입력을 만드는 것만 검증한다.
//
// AttendanceInputDay = { id, work_date, starts_at, ends_at,
// assignments: { profile_id, ended_at }[] }.
// AttendanceInputCheckIn = { day_id, profile_id, checked_at, reported_at,
// received_at }. AttendanceInputExcuseStatus = { day_id, profile_id,
// submitted_at, decided_at, decision }.
//
// - ended_at이 찬 배정은 그 사람의 그날 몫이 안 생긴다
// - checkIn·excuse는 day_id와 profile_id가 둘 다 맞아야 그 배정에 붙는다 —
//   같은 사람의 다른 날 기록이 섞이지 않는다
// - 출근(present)과 출근 인정(excused)을 합치지 않는다(ATT-023)

import { tallyMonthlyAttendance } from "@/entities/attendance/utils/attendanceSummary.utils";
import {
  buildAttendanceInputs,
  daysOfPerson,
} from "@/features/stats/utils/attendanceInputs.utils";

const DAYS = [
  {
    id: "day-1",
    work_date: "2026-09-10",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    assignments: [
      { profile_id: "p1", ended_at: null },
      { profile_id: "p5", ended_at: null },
      { profile_id: "p2", ended_at: null },
      { profile_id: "p3", ended_at: "2026-09-05T00:00:00.000Z" },
    ],
  },
  {
    id: "day-2",
    work_date: "2026-09-11",
    starts_at: "09:00:00",
    ends_at: "17:00:00",
    assignments: [{ profile_id: "p4", ended_at: null }],
  },
];

const CHECK_INS = [
  {
    day_id: "day-1",
    profile_id: "p1",
    checked_at: "2026-09-10T01:15:00.000Z",
    reported_at: "2026-09-10T01:15:00.000Z",
    received_at: "2026-09-10T01:15:00.000Z",
  },
  {
    day_id: "day-1",
    profile_id: "p5",
    checked_at: "2026-09-10T01:05:00.000Z",
    reported_at: "2026-09-10T01:05:00.000Z",
    received_at: "2026-09-10T01:05:00.000Z",
  },
  {
    day_id: "day-1",
    profile_id: "p3",
    checked_at: "2026-09-10T01:07:00.000Z",
    reported_at: "2026-09-10T01:07:00.000Z",
    received_at: "2026-09-10T01:07:00.000Z",
  },
  {
    day_id: "day-2",
    profile_id: "p1",
    checked_at: "2026-09-11T00:05:00.000Z",
    reported_at: "2026-09-11T00:05:00.000Z",
    received_at: "2026-09-11T00:05:00.000Z",
  },
];

const EXCUSE_STATUSES = [
  {
    day_id: "day-2",
    profile_id: "p4",
    submitted_at: "2026-09-11T09:10:00.000Z",
    decided_at: "2026-09-11T10:00:00.000Z",
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

describe("buildAttendanceInputs — day_id와 profile_id가 둘 다 맞아야 그 배정에 붙는다", () => {
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

// daysOfPerson(days, profileId) — 그달 날들을 그 사람 배정만 남기고 좁힌다. 같은 손이
// screens/adminStats와 screens/stats에 로컬 함수로 각자 서 있었다(`daysOfPerson`·
// `myDaysOf`). 안 좁히면 같은 날 같이 선 사람의 결근까지 그 사람 숫자에 든다.
describe("daysOfPerson — 그 사람 배정만 남긴다", () => {
  it("남의 배정은 그 날의 배정 목록에서 빠진다", () => {
    const mine = daysOfPerson(DAYS, "p1");

    expect(
      mine.flatMap((day) =>
        day.assignments.map((assignment) => assignment.profile_id),
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
