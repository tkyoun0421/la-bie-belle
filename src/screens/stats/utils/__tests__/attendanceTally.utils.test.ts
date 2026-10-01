// 구현 대상: src/screens/stats/model/attendanceTally.ts (아직 없다)
//
// myAttendanceTally(days, checkIns, excuseStatuses, profileId, now) — 내 근태
// tally를 한 자리로 접는다. StatsScreen.tsx의 myDaysOf(그달 날을 내 배정만
// 남기는 손)와 screens/stats/model/chartValues.ts 안에 비공개로 사는 같은
// 손이 buildAttendanceInputs·tallyMonthlyAttendance 호출과 한 덩이로 묶이는
// 자리다 — 둘 다 이 함수를 부르는 모양이어야 한다.
//
// - 좁히기: 그달 날들을 profileId가 든 배정만 남기고 좁힌다. profileId가
//   null이면(프로필을 아직 못 읽은 순간) 좁힌 날이 빈 배열이라 넷 다 0이다.
// - 좁힌 뒤에는 features/stats/model/attendanceInputs.ts의
//   buildAttendanceInputs로 재료를 맞물리고 entities/attendance/model/
//   attendanceSummary.ts의 tallyMonthlyAttendance로 센다 — 판정도 셈도
//   여기서 다시 안 짠다.
// - 확인 중(pending)과 안 찍음(unmarked)은 넷(출근·지각·결근·인정) 중
//   어디에도 안 든다(tallyMonthlyAttendance의 계약 그대로).

import type {
  ScheduleAssignment,
  ScheduleDay,
} from "@/entities/schedule/api/getMonthSchedule.api";
import type {
  AttendanceInputCheckIn,
  AttendanceInputExcuseStatus,
} from "@/features/stats/utils/attendanceInputs.utils";
import { myAttendanceTally } from "@/screens/stats/utils/attendanceTally.utils";

const ME = "profile-me";

const OTHER = "profile-other";

const NOW = "2026-09-15T12:00:00.000Z";

function assignment(
  profileId: string,
  overrides: Partial<ScheduleAssignment> = {},
): ScheduleAssignment {
  return {
    id: `a-${profileId}`,
    slot_id: null,
    position: "메인",
    kind: "regular",
    profile_id: profileId,
    ended_at: null,
    profiles: null,
    ...overrides,
  };
}

function scheduleDay(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    id: "day-x",
    work_date: "2026-09-10",
    starts_at: "10:00:00",
    ends_at: "19:00:00",
    opened_at: "2026-09-01T00:00:00.000Z",
    slots: [],
    check_ins: [],
    assignments: [assignment(ME)],
    ...overrides,
  };
}

describe("myAttendanceTally — 내 배정만 남기고 좁힌 뒤 센다", () => {
  it("남의 배정에 붙은 출근 인증은 내 tally에 안 든다", () => {
    const mine = scheduleDay({
      id: "day-mine",
      work_date: "2026-09-10",
      assignments: [assignment(ME)],
    });
    const others = scheduleDay({
      id: "day-other",
      work_date: "2026-09-11",
      assignments: [assignment(OTHER)],
    });
    const checkIns: AttendanceInputCheckIn[] = [
      {
        day_id: "day-mine",
        profile_id: ME,
        checked_at: "2026-09-10T01:00:00.000Z",
        reported_at: "2026-09-10T01:00:00.000Z",
        received_at: "2026-09-10T01:00:00.000Z",
      },
      {
        day_id: "day-other",
        profile_id: OTHER,
        checked_at: "2026-09-11T01:00:00.000Z",
        reported_at: "2026-09-11T01:00:00.000Z",
        received_at: "2026-09-11T01:00:00.000Z",
      },
    ];

    const tally = myAttendanceTally([mine, others], checkIns, [], ME, NOW);

    expect(tally.present).toBe(1);
  });
});

describe("myAttendanceTally — 좁힌 뒤에는 buildAttendanceInputs·tallyMonthlyAttendance를 그대로 불러 넷을 센다", () => {
  it("출근·지각·결근·인정이 하루씩이면 tally가 {present:1, late:1, absent:1, excused:1}이다", () => {
    const days: ScheduleDay[] = [
      scheduleDay({
        id: "day-present",
        work_date: "2026-09-10",
        assignments: [assignment(ME)],
      }),
      scheduleDay({
        id: "day-late",
        work_date: "2026-09-11",
        assignments: [assignment(ME)],
      }),
      scheduleDay({
        id: "day-absent",
        work_date: "2026-09-12",
        assignments: [assignment(ME)],
      }),
      scheduleDay({
        id: "day-excused",
        work_date: "2026-09-13",
        assignments: [assignment(ME)],
      }),
    ];
    const checkIns: AttendanceInputCheckIn[] = [
      {
        day_id: "day-present",
        profile_id: ME,
        checked_at: "2026-09-10T01:00:00.000Z",
        reported_at: "2026-09-10T01:00:00.000Z",
        received_at: "2026-09-10T01:00:00.000Z",
      },
      {
        day_id: "day-late",
        profile_id: ME,
        checked_at: "2026-09-11T01:20:00.000Z",
        reported_at: "2026-09-11T01:20:00.000Z",
        received_at: "2026-09-11T01:20:00.000Z",
      },
    ];
    const excuseStatuses: AttendanceInputExcuseStatus[] = [
      {
        day_id: "day-excused",
        profile_id: ME,
        submitted_at: "2026-09-13T10:00:00.000Z",
        decided_at: "2026-09-13T12:00:00.000Z",
        decision: "approved",
      },
    ];

    const tally = myAttendanceTally(days, checkIns, excuseStatuses, ME, NOW);

    expect(tally).toEqual({ present: 1, late: 1, absent: 1, excused: 1 });
  });
});

describe("myAttendanceTally — 확인 중과 안 찍음은 넷 중 어디에도 안 든다", () => {
  it("사유 미결(확인 중)과 아무 반응 없는 날(안 찍음)은 넷 다 0으로 남긴다", () => {
    const days: ScheduleDay[] = [
      scheduleDay({
        id: "day-pending",
        work_date: "2026-09-14",
        assignments: [assignment(ME)],
      }),
      scheduleDay({
        id: "day-unmarked",
        work_date: "2026-09-15",
        assignments: [assignment(ME)],
      }),
    ];
    const excuseStatuses: AttendanceInputExcuseStatus[] = [
      {
        day_id: "day-pending",
        profile_id: ME,
        submitted_at: "2026-09-14T10:00:00.000Z",
        decided_at: null,
        decision: null,
      },
    ];

    const tally = myAttendanceTally(days, [], excuseStatuses, ME, NOW);

    expect(tally).toEqual({ present: 0, late: 0, absent: 0, excused: 0 });
  });
});

describe("myAttendanceTally — 프로필을 아직 못 읽은 순간(profileId가 null)은 좁힌 날이 없어 전부 0이다", () => {
  it("근태가 확실한 날들이 있어도 profileId가 null이면 tally가 전부 0이다", () => {
    const days: ScheduleDay[] = [
      scheduleDay({
        id: "day-present",
        work_date: "2026-09-10",
        assignments: [assignment(ME)],
      }),
    ];
    const checkIns: AttendanceInputCheckIn[] = [
      {
        day_id: "day-present",
        profile_id: ME,
        checked_at: "2026-09-10T01:00:00.000Z",
        reported_at: "2026-09-10T01:00:00.000Z",
        received_at: "2026-09-10T01:00:00.000Z",
      },
    ];

    const tally = myAttendanceTally(days, checkIns, [], null, NOW);

    expect(tally).toEqual({ present: 0, late: 0, absent: 0, excused: 0 });
  });
});
