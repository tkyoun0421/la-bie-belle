// 구현 대상: src/screens/adminStats/utils/chartValues.utils.ts (아직 없다)
//
// AdminStatsScreen.tsx(418·429·444·458·469행)에 살던 계산 함수 다섯을 이 파일로
// 내린다(ADR-001, eslint-rules/dumbUi.mjs는 통신 축만 봐서 못 걸렀다). 함수와
// 단언은 그대로고 자리만 옮긴다.
//
// monthIn은 shared/utils/monthIn.ts로 올라갔다 — 같은 손이 근무자 통계에 생
// `.find`로 세 자리 있었고 슬라이스끼리는 서로를 못 부른다. 단언 셋도 같이 갔다.
// workValues(loaded) — 근무 탭 추이 그래프의 달별 총 근무 분이다. 날이 하나도
// 안 열린 달은 Map에서 빠진다(0으로 이으면 「안 일한 달」로 읽힌다).
// attendanceValues(loaded, tabs) — 근태 탭 추이 그래프의 달별 출근율이다.
// attendanceRate가 null을 내는 달은 빠진다.
// percentLabel(tab) — attendanceRate가 null이면 값 없음 표시("–")고, 아니면
// "60%" 꼴이다.
//
// attendanceRate 자체는 plan stats-worker AC-01로 entities/attendance/model/
// attendanceSummary.ts에 내려갔다(인자도 AttendanceTab이 아니라
// MonthlyAttendanceTally다) — attendanceValues와 percentLabel은 그 함수를 안에서
// 불러 쓴다.

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

// attendanceRate는 src/entities/attendance/utils/attendanceSummary.utils.ts로 내려갔다
// (plan stats-worker AC-01). 그 자리의 단언은
// entities/attendance/model/__tests__/attendanceSummary.test.ts가 든다 — 인자도
// AttendanceTab이 아니라 MonthlyAttendanceTally 하나로 바뀌었다.

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
