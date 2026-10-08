import { canAddOn } from "@/entities/rehearsal/model/canAddOn.policy";

describe("canAddOn — 건수 갈래에 줄이 있으면 못 넣는다", () => {
  it("건수 갈래인데 줄이 없으면 넣을 수 있다", () => {
    expect(canAddOn("count", [])).toBe(true);
  });

  it("건수 갈래에 줄이 이미 있으면 못 넣는다", () => {
    expect(canAddOn("count", [{ id: "row-1" }])).toBe(false);
  });
});

describe("canAddOn — 시각 갈래는 줄이 있어도 더 넣을 수 있다", () => {
  it("시각 갈래는 줄이 여럿이어도 늘 참이다", () => {
    expect(canAddOn("time", [{ id: "row-1" }, { id: "row-2" }])).toBe(true);
  });

  it("시각 갈래는 줄이 없어도 참이다", () => {
    expect(canAddOn("time", [])).toBe(true);
  });
});
