import type { ScheduleDay } from "@/entities/schedule/api/schedule.dto";
import type { WorkMonth } from "@/entities/schedule/services/useWorkMonthsQuery";
import type { AttendanceMonth } from "@/features/stats/services/useAttendanceMonthsQuery";
import type { AttendanceTab } from "@/screens/adminStats/model/adminStats.type";
import {
  attendanceValues,
  percentLabel,
  workValues,
} from "@/screens/adminStats/utils/chartValues.utils";

function workedDay(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    id: "day-1",
    work_date: "2026-08-01",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    opened_at: "2026-08-01T00:00:00.000Z",
    slots: [],
    check_ins: [],
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
    ],
    ...overrides,
  };
}

describe("workValues — 날이 하나도 안 열린 달은 값이 없다(0으로 이으면 안 일한 달로 읽힌다)", () => {
  it("근무일이 있는 달만 Map에 오르고 빈 달은 키 자체가 없다", () => {
    const loaded: WorkMonth[] = [
      { month: "2026-08", days: [workedDay()] },
      { month: "2026-09", days: [] },
    ];

    const values = workValues(loaded);

    expect(values.get("2026-08")).toBe(480);
    expect(values.has("2026-09")).toBe(false);
  });

  it("loaded가 undefined면 빈 Map이다", () => {
    expect(workValues(undefined).size).toBe(0);
  });
});

const TAB_WITH_DATA: AttendanceTab = {
  tally: { present: 8, late: 1, absent: 1, excused: 0 },
  rows: [],
};

const EMPTY_TAB: AttendanceTab = {
  tally: { present: 0, late: 0, absent: 0, excused: 0 },
  rows: [],
};

describe("attendanceValues — 출근율을 못 구하는 달은 그래프에서 빠진다", () => {
  it("넷이 다 0인 달은 Map에서 빠지고 값이 있는 달만 남는다", () => {
    const loaded: AttendanceMonth[] = [
      {
        month: "2026-08",
        days: [],
        attendance: { checkIns: [], excuseStatuses: [] },
      },
      {
        month: "2026-09",
        days: [],
        attendance: { checkIns: [], excuseStatuses: [] },
      },
    ];
    const tabs = new Map<string, AttendanceTab>([
      ["2026-08", TAB_WITH_DATA],
      ["2026-09", EMPTY_TAB],
    ]);

    const values = attendanceValues(loaded, tabs);

    expect(values.get("2026-08")).toBe(80);
    expect(values.has("2026-09")).toBe(false);
  });

  it("그 달의 tab 자체가 없으면(tabs에 없는 달) 역시 빠진다", () => {
    const loaded: AttendanceMonth[] = [
      {
        month: "2026-08",
        days: [],
        attendance: { checkIns: [], excuseStatuses: [] },
      },
    ];

    const values = attendanceValues(loaded, new Map());

    expect(values.has("2026-08")).toBe(false);
  });
});

describe("percentLabel — 값이 없는 달은 백분율 대신 빈 표시가 선다", () => {
  it("출근율을 구할 수 있으면 '60%'꼴이다", () => {
    const tab: AttendanceTab = {
      tally: { present: 6, late: 1, absent: 1, excused: 2 },
      rows: [],
    };

    expect(percentLabel(tab)).toBe("60%");
  });

  it("넷이 다 0이면 '–'다", () => {
    expect(percentLabel(EMPTY_TAB)).toBe("–");
  });
});
