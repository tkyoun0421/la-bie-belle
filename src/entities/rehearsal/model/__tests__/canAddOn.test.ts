// 구현 대상: src/entities/rehearsal/model/canAddOn.ts
//
// 날 시트의 「리허설 넣기」가 사라지는 조건이다(plan AC-04, SCH-023) — 건수 갈래인 날에
// 줄이 이미 있으면 하루 한 줄로 묶여 있어서 더 못 넣는다. 시각 갈래는 구간이 안 겹치기만
// 하면 여러 줄을 넣을 수 있어 제한이 없다.

import { canAddOn } from "@/entities/rehearsal/model/canAddOn";

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
