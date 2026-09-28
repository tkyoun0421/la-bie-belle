// 구현 대상: src/screens/admin-stats/model/chart-values.ts (아직 없다)
//
// AdminStatsScreen.tsx(418·429·444·458·469행)에 살던 계산 함수 다섯을 이 파일로
// 내린다(ADR-001, eslint-rules/dumb-ui.mjs는 통신 축만 봐서 못 걸렀다). 함수와
// 단언은 그대로고 자리만 옮긴다.
//
// monthIn(loaded, month) — 열두 달 배열에서 그 달의 로드 결과 하나를 집는다.
// workValues(loaded) — 근무 탭 추이 그래프의 달별 총 근무 분이다. 날이 하나도
// 안 열린 달은 Map에서 빠진다(0으로 이으면 「안 일한 달」로 읽힌다).
// attendanceValues(loaded, tabs) — 근태 탭 추이 그래프의 달별 출근율이다.
// attendanceRate(tab)이 null을 내는 달은 빠진다.
// attendanceRate(tab) — 출근율은 인증이 실제로 몇 번 돌았나다(docs/2-design/
// system/screens/stats.md 「추이 그래프」). 출근을 출근·지각·결근·출근 인정의
// 합으로 나누고, 출근 인정은 분모에만 든다. 넷이 다 0이면 null이다.
// percentLabel(tab) — attendanceRate가 null이면 값 없음 표시("–")고, 아니면
// "60%" 꼴이다.

import type { ScheduleDay } from "@/entities/schedule/dals/get-month-schedule";
import type {
  AttendanceMonth,
  WorkMonth,
} from "@/features/stats/api/useStatsQueries";
import type { AttendanceTab } from "@/screens/admin-stats/model/attendance-rows";
import {
  attendanceRate,
  attendanceValues,
  monthIn,
  percentLabel,
  workValues,
} from "@/screens/admin-stats/model/chart-values";

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

describe("monthIn — 열두 달 배열에서 그 달의 로드 결과 하나를 집는다", () => {
  it("month가 일치하는 항목을 낸다", () => {
    const loaded = [
      { month: "2026-08", value: 1 },
      { month: "2026-09", value: 2 },
    ];

    expect(monthIn(loaded, "2026-09")).toEqual({ month: "2026-09", value: 2 });
  });

  it("일치하는 달이 없으면 undefined다", () => {
    const loaded = [{ month: "2026-08", value: 1 }];

    expect(monthIn(loaded, "2026-09")).toBeUndefined();
  });

  it("loaded 자체가 undefined면 undefined다 — 아직 안 읽힌 달과 같은 값이다", () => {
    expect(monthIn(undefined, "2026-09")).toBeUndefined();
  });
});

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

describe("attendanceRate — 출근율은 인증이 실제로 몇 번 돌았나다(stats.md 「추이 그래프」)", () => {
  it("출근·지각·결근·출근 인정의 합이 분모고 출근 인정은 분모에만 든다", () => {
    const tab: AttendanceTab = {
      tally: { present: 6, late: 1, absent: 1, excused: 2 },
      rows: [],
    };

    expect(attendanceRate(tab)).toBe(60);
  });

  it("넷이 다 0이면 null이다 — 그 달은 점을 안 찍는다", () => {
    expect(attendanceRate(EMPTY_TAB)).toBeNull();
  });

  it("그 달의 tab 자체가 없어도 null이다", () => {
    expect(attendanceRate(undefined)).toBeNull();
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
