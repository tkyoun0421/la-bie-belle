// 구현 대상: src/screens/scheduleAdmin/model/monthEmptyState.ts
//
// 「전부 지난 달」 판정이다 — 그 달의 마지막 날이 오늘(KST) 이전이면 만들기 버튼이 없고
// 빈 상태 제목만 남는다(plan AC-02, schedule-admin.md 「달 근무표 만들기 짜임」의
// 「만들기는 달 단위로 막지 않는다」). 열 수 있는 날이 하루라도 남았으면(SCH-002) 지나가는
// 중인 달도 만들 수 있다 — 즉 마지막 날이 오늘이면 아직 안 지난 것으로 본다.

import { isMonthFullyPast } from "@/screens/scheduleAdmin/model/monthEmptyState";

describe("isMonthFullyPast — 마지막 날이 오늘보다 전이면 전부 지난 달이다", () => {
  it("9월의 마지막 날(9/30)이 10월 1일 기준으로 지났으면 true다", () => {
    const past = isMonthFullyPast({
      month: "2026-09",
      now: "2026-10-01T00:00:00Z",
    });

    expect(past).toBe(true);
  });
});

describe("isMonthFullyPast — 마지막 날이 오늘이면 아직 지난 것이 아니다", () => {
  it("9월 30일 당일 기준으로는 false다 — 열 수 있는 날이 하루 남아서다(SCH-002)", () => {
    const past = isMonthFullyPast({
      month: "2026-09",
      now: "2026-09-30T00:00:00Z",
    });

    expect(past).toBe(false);
  });
});

describe("isMonthFullyPast — 지금 달이나 미래 달은 지난 달이 아니다", () => {
  it("이번 달이면 false다", () => {
    const past = isMonthFullyPast({
      month: "2026-10",
      now: "2026-10-05T00:00:00Z",
    });

    expect(past).toBe(false);
  });

  it("미래 달이면 false다", () => {
    const past = isMonthFullyPast({
      month: "2027-01",
      now: "2026-10-05T00:00:00Z",
    });

    expect(past).toBe(false);
  });
});
