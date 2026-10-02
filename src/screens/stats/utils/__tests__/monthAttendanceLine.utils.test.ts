// 구현 대상: src/screens/stats/utils/monthAttendanceLine.utils.ts (아직 없다)
//
// monthAttendanceLine(tally) — 근태 현황 줄이다(stats.md 「근태 현황
// 줄」·「통계 문안」의 「출근 41 · 지각 4 · 출근 인정 2 · 결근 1」). 관리자
// 쪽은 이 조립을 AdminStatsScreen.tsx 안에서 인라인 템플릿 리터럴로
// 하는데(342행) 그것이 ADR-001 위반이다 — 근무자 쪽에서 되풀이하지 않는다.
//
// 순서는 출근 · 지각 · 출근 인정 · 결근이다(문서 표의 순서 그대로, 비율
// 띠의 몫 순서인 출근·인정·지각·결근과는 다르다).
//
// **0인 몫도 안 빠진다.** 비율 띠 아래 범례는 몫이 0이면 통째로 빠지지만
// (stats.md 「근태 현황 줄」 "몫이 0인 것은 범례에서도 빠진다"), 현황 줄은
// 그 규칙이 안 붙는다 — 관리자 쪽 인라인 코드(AdminStatsScreen.tsx 342행)도
// 넷을 항상 다 적는다. 사람별 목록 줄의 "지각이 0이면 그 자리가 비어
// 있다"는 것과도 다른 자리다.

import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance.type";
import { monthAttendanceLine } from "@/screens/stats/utils/monthAttendanceLine.utils";

describe("monthAttendanceLine — 출근·지각·출근 인정·결근 순서로 한 줄을 낸다", () => {
  it("넷이 모두 값이 있으면 '출근 41 · 지각 4 · 출근 인정 2 · 결근 1'이다", () => {
    const tally: MonthlyAttendanceTally = {
      present: 41,
      late: 4,
      excused: 2,
      absent: 1,
    };

    expect(monthAttendanceLine(tally)).toBe(
      "출근 41 · 지각 4 · 출근 인정 2 · 결근 1",
    );
  });
});

describe("monthAttendanceLine — 0인 몫도 안 빠진다(비율 띠 범례와 다른 자리다)", () => {
  it("지각·출근 인정·결근이 모두 0이어도 넷 다 그대로 선다", () => {
    const tally: MonthlyAttendanceTally = {
      present: 10,
      late: 0,
      excused: 0,
      absent: 0,
    };

    expect(monthAttendanceLine(tally)).toBe(
      "출근 10 · 지각 0 · 출근 인정 0 · 결근 0",
    );
  });
});
