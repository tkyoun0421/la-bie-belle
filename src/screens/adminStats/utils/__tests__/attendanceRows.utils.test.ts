// 구현 대상: src/screens/adminStats/model/attendanceRows.ts
//
// buildAttendanceRows(people) — 근태 탭 사람별 목록을 조립한다(plan·spec
// stats-admin AC-09, stats.md「근태 사람별 목록」). AttendanceRowInput은
// { profileId, displayName, present, late, absent, excused }다.
//
// - 이름 가나다순이다 — 근무 탭 사람별 구획(시간 많은 순)과 반대다
// - 지각이 0이면 그 자리가 빈다: late가 0이면 결과의 late는 null이다 — 「지각
//   0」을 안 적는다는 뜻을 화면이 렌더할 수 있게 값 자체를 비운다
// - 출근(present)은 지각과 달리 0이어도 그 값 그대로다 — 출근은 항상 서는
//   기본 값이라서다. absent·excused의 0-처리는 이 task가 배정받은 범위 밖이라
//   여기서 단언하지 않는다(아래 「못 쓴 것」 참고)

import type { ScheduleDay } from "@/entities/schedule/api/getMonthSchedule.api";
import type {
  AttendanceInputCheckIn,
  AttendanceInputExcuseStatus,
} from "@/features/stats/model/attendanceInputs";
import {
  attendanceRowValue,
  buildAttendanceRows,
  buildAttendanceTab,
  type AttendanceRow,
} from "@/screens/adminStats/model/attendanceRows";

describe("buildAttendanceRows — 이름 가나다순이다(근무 탭과 반대)", () => {
  it("입력 순서와 무관하게 김지우·박서연·최윤아 순으로 선다", () => {
    const rows = buildAttendanceRows([
      {
        profileId: "p4",
        displayName: "최윤아",
        present: 10,
        late: 0,
        absent: 0,
        excused: 0,
      },
      {
        profileId: "p1",
        displayName: "김지우",
        present: 12,
        late: 1,
        absent: 0,
        excused: 0,
      },
      {
        profileId: "p2",
        displayName: "박서연",
        present: 11,
        late: 0,
        absent: 1,
        excused: 0,
      },
    ]);

    expect(rows.map((row) => row.displayName)).toEqual([
      "김지우",
      "박서연",
      "최윤아",
    ]);
  });
});

describe("buildAttendanceRows — 지각이 0이면 그 자리가 빈다", () => {
  it("late가 0인 사람은 결과의 late가 null이다", () => {
    const [row] = buildAttendanceRows([
      {
        profileId: "p1",
        displayName: "김지우",
        present: 12,
        late: 0,
        absent: 0,
        excused: 0,
      },
    ]);

    expect(row.late).toBeNull();
  });

  it("late가 1 이상인 사람은 그 수가 그대로 남는다", () => {
    const [row] = buildAttendanceRows([
      {
        profileId: "p1",
        displayName: "김지우",
        present: 12,
        late: 3,
        absent: 0,
        excused: 0,
      },
    ]);

    expect(row.late).toBe(3);
  });
});

describe("buildAttendanceRows — 출근은 0이어도 그 값 그대로 남는다", () => {
  it("present는 지각과 달리 0을 null로 바꾸지 않는다", () => {
    const [row] = buildAttendanceRows([
      {
        profileId: "p1",
        displayName: "김지우",
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      },
    ]);

    expect(row.present).toBe(0);
  });
});

describe("buildAttendanceRows — 입력이 비어 있으면 빈 목록이다", () => {
  it("사람이 없으면 빈 배열이다", () => {
    expect(buildAttendanceRows([])).toEqual([]);
  });
});

function nameDay(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    id: "day-1",
    work_date: "2026-09-10",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    opened_at: "2026-09-10T00:00:00.000Z",
    slots: [],
    check_ins: [],
    assignments: [],
    ...overrides,
  };
}

const TAB_DAYS: ScheduleDay[] = [
  nameDay({
    id: "day-1",
    work_date: "2026-09-10",
    assignments: [
      {
        id: "a1",
        slot_id: null,
        position: "메인",
        kind: "regular",
        profile_id: "p1",
        ended_at: null,
        profiles: { display_name: "김지우" },
      },
      {
        id: "a2",
        slot_id: null,
        position: "메인",
        kind: "regular",
        profile_id: "p5",
        ended_at: null,
        profiles: { display_name: "이수민" },
      },
      {
        id: "a3",
        slot_id: null,
        position: "메인",
        kind: "regular",
        profile_id: "p2",
        ended_at: null,
        profiles: { display_name: "박서연" },
      },
      {
        id: "a4",
        slot_id: null,
        position: "스캔",
        kind: "regular",
        profile_id: "p3",
        ended_at: "2026-09-05T00:00:00.000Z",
        profiles: { display_name: "정하늘" },
      },
    ],
  }),
  nameDay({
    id: "day-2",
    work_date: "2026-09-11",
    starts_at: "09:00:00",
    ends_at: "17:00:00",
    assignments: [
      {
        id: "a5",
        slot_id: null,
        position: "안내",
        kind: "regular",
        profile_id: "p4",
        ended_at: null,
        profiles: { display_name: "최윤아" },
      },
    ],
  }),
];

const TAB_CHECK_INS: AttendanceInputCheckIn[] = [
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
];

const TAB_EXCUSE_STATUSES: AttendanceInputExcuseStatus[] = [
  {
    day_id: "day-2",
    profile_id: "p4",
    submitted_at: "2026-09-11T09:10:00.000Z",
    decided_at: "2026-09-11T10:00:00.000Z",
    decision: "approved",
  },
];

const TAB_NOW = "2026-09-12T10:00:00.000Z";

describe("buildAttendanceTab — 산 배정이 있는 사람만 사람별 목록에 선다", () => {
  it("취소된 배정만 있는 정하늘(p3)은 목록에 안 선다 — 나머지 넷만 선다", () => {
    const tab = buildAttendanceTab(
      TAB_DAYS,
      TAB_CHECK_INS,
      TAB_EXCUSE_STATUSES,
      TAB_NOW,
    );

    expect(tab.rows.map((row) => row.displayName)).toEqual([
      "김지우",
      "박서연",
      "이수민",
      "최윤아",
    ]);
  });
});

describe("buildAttendanceTab — 현황 줄(tally)은 사람별 목록 넷을 더한 값과 같다", () => {
  it("세는 것이 tallyMonthlyAttendance 하나라 전체를 따로 세도 어긋나지 않는다", () => {
    const tab = buildAttendanceTab(
      TAB_DAYS,
      TAB_CHECK_INS,
      TAB_EXCUSE_STATUSES,
      TAB_NOW,
    );

    expect(tab.tally).toEqual({ present: 1, late: 1, absent: 1, excused: 1 });
  });
});

const ALL_PARTS_ROW: AttendanceRow = {
  profileId: "p1",
  displayName: "김지우",
  present: 12,
  late: 1,
  absent: 1,
  excused: 1,
};

describe("attendanceRowValue — 0인 몫은 낱말째 빠져 늦은 사람만 눈에 띈다", () => {
  it("지각·결근·출근 인정이 다 없으면 '출근 12'뿐이다", () => {
    expect(
      attendanceRowValue({
        profileId: "p1",
        displayName: "김지우",
        present: 12,
        late: null,
        absent: null,
        excused: null,
      }),
    ).toBe("출근 12");
  });

  it("넷이 다 있으면 출근·지각·출근 인정·결근 순으로 · 로 이어진다", () => {
    expect(attendanceRowValue(ALL_PARTS_ROW)).toBe(
      "출근 12 · 지각 1 · 출근 인정 1 · 결근 1",
    );
  });
});
