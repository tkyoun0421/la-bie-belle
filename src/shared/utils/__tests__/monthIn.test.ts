import { monthIn } from "@/shared/utils/monthIn";

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
