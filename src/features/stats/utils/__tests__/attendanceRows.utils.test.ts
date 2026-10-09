import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
import type { AttendanceRow } from "@/features/stats/model/attendanceTab.type";
import type {
  AttendanceInputCheckIn,
  AttendanceInputExcuseStatus,
} from "@/features/stats/utils/attendanceInputs.utils";
import {
  attendanceRowValue,
  buildAttendanceRows,
  buildAttendanceTab,
} from "@/features/stats/utils/attendanceRows.utils";

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
    workDate: "2026-09-10",
    startsAt: "10:00:00",
    endsAt: "18:00:00",
    openedAt: "2026-09-10T00:00:00.000Z",
    slots: [],
    checkIns: [],
    assignments: [],
    ...overrides,
  };
}

const TAB_DAYS: ScheduleDay[] = [
  nameDay({
    id: "day-1",
    workDate: "2026-09-10",
    assignments: [
      {
        id: "a1",
        slotId: null,
        position: "메인",
        kind: "regular",
        profileId: "p1",
        endedAt: null,
        name: "김지우",
      },
      {
        id: "a2",
        slotId: null,
        position: "메인",
        kind: "regular",
        profileId: "p5",
        endedAt: null,
        name: "이수민",
      },
      {
        id: "a3",
        slotId: null,
        position: "메인",
        kind: "regular",
        profileId: "p2",
        endedAt: null,
        name: "박서연",
      },
      {
        id: "a4",
        slotId: null,
        position: "스캔",
        kind: "regular",
        profileId: "p3",
        endedAt: "2026-09-05T00:00:00.000Z",
        name: "정하늘",
      },
    ],
  }),
  nameDay({
    id: "day-2",
    workDate: "2026-09-11",
    startsAt: "09:00:00",
    endsAt: "17:00:00",
    assignments: [
      {
        id: "a5",
        slotId: null,
        position: "안내",
        kind: "regular",
        profileId: "p4",
        endedAt: null,
        name: "최윤아",
      },
    ],
  }),
];

const TAB_CHECK_INS: AttendanceInputCheckIn[] = [
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
];

const TAB_EXCUSE_STATUSES: AttendanceInputExcuseStatus[] = [
  {
    dayId: "day-2",
    profileId: "p4",
    submittedAt: "2026-09-11T09:10:00.000Z",
    decidedAt: "2026-09-11T10:00:00.000Z",
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
