// 구현 대상: src/shared/lib/monthBoundary.ts (아직 없다)
//
// canGoBack(month, firstScheduleMonth) — 뒤로 가는 화살표가 서는지다. 바닥은
// 첫 근무표가 있는 달이다(plan stats-admin 「착수 판정」 — get-first-schedule-month
// 값을 받은 뒤의 경계 판정). firstScheduleMonth는 그 dal이 그대로 내는
// `schedules.month` 값 — "YYYY-MM-01" 꼴의 달 첫날 전체 날짜다(정수 슬라이스로
// 달을 가른다는 점에서 payroll/model/boundary.ts의 canGoBack(period, approvedAt)과
// 같은 결). month가 firstScheduleMonth가 든 달과 같으면 더 뒤로 못 간다.
//
// canGoForward(month, today) — 앞으로 가는 화살표가 서는지다. 바닥이 아니라
// 천장은 이번 달이다 — month가 today가 든 달과 같으면 더 앞으로 못 간다
// (spec stats-admin AC-04).
//
// month는 "YYYY-MM", firstScheduleMonth·today는 "YYYY-MM-DD"(전체 날짜)다.
//
// 관리자 통계(src/screens/admin-stats/model/month-boundary.ts)와 근무자
// 통계(src/screens/stats/ui/StatsScreen.tsx)가 같은 경계를 인라인으로 각각
// 판정하고 있었다 — lint 규칙 3으로는 두 통계 슬라이스가 서로를 못 불러
// 사본이 둘로 늘던 자리를 shared/lib로 올려 하나로 묶는다. 계약은 관리자
// 쪽 짝 테스트와 같다 — 단언을 그대로 옮긴다.

import { canGoBack, canGoForward } from "@/shared/lib/monthBoundary";

describe("canGoBack — 첫 근무표가 있는 달과 같으면 뒤로 화살표가 사라진다", () => {
  it("첫 근무표 달 2025-11-01이 든 2025-11은 false다", () => {
    expect(canGoBack("2025-11", "2025-11-01")).toBe(false);
  });
});

describe("canGoBack — 첫 근무표가 있는 달보다 나중이면 뒤로 화살표가 산다", () => {
  it("첫 근무표 달의 다음 달은 true다", () => {
    expect(canGoBack("2025-12", "2025-11-01")).toBe(true);
  });
});

describe("canGoBack — 첫 근무표가 있는 달보다 이전 달은 없다고 봐도 화살표가 안 산다", () => {
  it("이론상 그보다 이른 달이 와도 false다", () => {
    expect(canGoBack("2025-10", "2025-11-01")).toBe(false);
  });
});

describe("canGoBack — firstScheduleMonth의 일(day)은 안 본다, 달만 본다", () => {
  it("같은 달이면 일자가 달라도(01이 아니어도) false다", () => {
    expect(canGoBack("2025-11", "2025-11-01")).toBe(false);
  });
});

describe("canGoForward — 이번 달과 같으면 앞으로 화살표가 사라진다", () => {
  it("오늘 2026-09-15가 든 2026-09는 false다", () => {
    expect(canGoForward("2026-09", "2026-09-15")).toBe(false);
  });
});

describe("canGoForward — 이번 달보다 이전 달은 앞으로 화살표가 산다", () => {
  it("이번 달의 이전 달은 true다", () => {
    expect(canGoForward("2026-08", "2026-09-15")).toBe(true);
  });
});
