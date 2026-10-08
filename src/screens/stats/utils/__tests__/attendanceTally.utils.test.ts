import type {
  ScheduleAssignment,
  ScheduleDay,
} from "@/entities/schedule/api/schedule.dto";
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
