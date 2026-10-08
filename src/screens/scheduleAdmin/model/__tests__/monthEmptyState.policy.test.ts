import { isMonthFullyPast } from "@/screens/scheduleAdmin/model/monthEmptyState.policy";

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
