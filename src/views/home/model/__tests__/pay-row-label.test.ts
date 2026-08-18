import { describe, expect, it } from "vitest";

import { toPayRowLabel } from "@/views/home/model/pay-row-label";

describe("toPayRowLabel — 라운드 30, 0인 갈래만 접두로 줄이고 나머지는 회수·시간을 적는다", () => {
  it("지난주 행은 회수와 시간을 적는다 — 시안 payCases.full.last", () => {
    const label = toPayRowLabel({ kind: "last-week", count: 2, hours: 11 });

    expect(label).toBe("지난주 · 2회 11시간");
  });

  it("지난주 행이 0이면 접두만 남는다 — 시안 payCases.lastweek/none.last", () => {
    const label = toPayRowLabel({ kind: "last-week", count: 0, hours: 0 });

    expect(label).toBe("지난주");
  });

  it("이번 달 행은 달 숫자와 회수·시간을 적는다 — 시안 payCases.full.month", () => {
    const label = toPayRowLabel({ kind: "this-month", month: 8, count: 6, hours: 30 });

    expect(label).toBe("8월 · 6회 30시간");
  });

  it("이번 달 행은 「이번 달」이 아니라 달 숫자다 — 시안 payCases.lastweek.month", () => {
    const label = toPayRowLabel({ kind: "this-month", month: 8, count: 2, hours: 10 });

    expect(label).toBe("8월 · 2회 10시간");
  });

  it("이번 달 행이 0이면 달 숫자만 남는다 — 시안 payCases.none.month", () => {
    const label = toPayRowLabel({ kind: "this-month", month: 8, count: 0, hours: 0 });

    expect(label).toBe("8월");
  });

  it("연 누적 행은 해 숫자와 회수만 적고 시간은 안 붙는다 — 시안 payCases.full.year", () => {
    const label = toPayRowLabel({ kind: "year-to-date", year: 2026, count: 58 });

    expect(label).toBe("2026년 누적 · 58회");
  });

  it("연 누적 행도 「올해」가 아니라 해 숫자다 — 시안 payCases.lastweek.year", () => {
    const label = toPayRowLabel({ kind: "year-to-date", year: 2026, count: 41 });

    expect(label).toBe("2026년 누적 · 41회");
  });

  it("연 누적 행이 0이면 해 숫자만 남는다 — 시안 payCases.none.year", () => {
    const label = toPayRowLabel({ kind: "year-to-date", year: 2026, count: 0 });

    expect(label).toBe("2026년 누적");
  });

  it("연 누적 라벨에는 시간 단위가 전혀 등장하지 않는다", () => {
    const label = toPayRowLabel({ kind: "year-to-date", year: 2026, count: 58 });

    expect(label).not.toContain("시간");
  });
});
