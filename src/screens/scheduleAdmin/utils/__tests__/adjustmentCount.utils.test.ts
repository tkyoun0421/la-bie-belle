import {
  adjustmentCountLine,
  type AdjustmentCountRow,
} from "@/screens/scheduleAdmin/utils/adjustmentCount.utils";

describe("adjustmentCountLine — 조정한 사람이 없으면 빈 문자열이다", () => {
  it("행이 0개면 빈 문자열이다", () => {
    expect(adjustmentCountLine([])).toBe("");
  });
});

describe("adjustmentCountLine — 마지막 행의 분이 0이 아닌 사람만 센다", () => {
  it("결근·연장이 각각 하나씩이면 2명 조정됨이다", () => {
    const rows: AdjustmentCountRow[] = [
      { profile_id: "p1", minutes: -540, adjusted_at: "2026-10-10T09:00:00Z" },
      { profile_id: "p2", minutes: 60, adjusted_at: "2026-10-10T09:00:00Z" },
    ];

    expect(adjustmentCountLine(rows)).toBe("2명 조정됨");
  });
});

describe("adjustmentCountLine — 마지막 행이 0분인 사람은 되돌린 것이라 안 센다", () => {
  it("조정이 하나뿐이고 그게 0분이면 0명이라 빈 문자열이다", () => {
    const rows: AdjustmentCountRow[] = [
      { profile_id: "p1", minutes: 0, adjusted_at: "2026-10-10T09:00:00Z" },
    ];

    expect(adjustmentCountLine(rows)).toBe("");
  });
});

describe("adjustmentCountLine — 같은 사람에게 행이 여럿이면 마지막 행만 본다", () => {
  it("결근 뒤 원래대로 되돌린 사람은 먼저 든 결근 행과 무관하게 안 센다", () => {
    const rows: AdjustmentCountRow[] = [
      { profile_id: "p1", minutes: -540, adjusted_at: "2026-10-10T09:00:00Z" },
      { profile_id: "p1", minutes: 0, adjusted_at: "2026-10-10T10:00:00Z" },
    ];

    expect(adjustmentCountLine(rows)).toBe("");
  });

  it("원래대로 뒤 다시 연장을 고른 사람은 마지막 행 기준으로 센다", () => {
    const rows: AdjustmentCountRow[] = [
      { profile_id: "p1", minutes: 0, adjusted_at: "2026-10-10T09:00:00Z" },
      { profile_id: "p1", minutes: 30, adjusted_at: "2026-10-10T10:00:00Z" },
    ];

    expect(adjustmentCountLine(rows)).toBe("1명 조정됨");
  });
});
