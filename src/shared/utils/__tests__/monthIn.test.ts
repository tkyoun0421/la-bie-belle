// 구현 대상: src/shared/utils/monthIn.ts (아직 없다)
//
// monthIn(loaded, month) — 달치로 읽어 온 배열에서 보는 달 하나를 집는다. 같은 손이
// screens 슬라이스 셋에 있었다 — adminStats가 함수로(chartValues.utils.ts), stats와
// StatsScreen.tsx가 생 `.find((one) => one.month === month)`로 들고 있었다. 슬라이스끼리는
// 서로를 못 불러(lint 규칙 3) 자리가 shared고, 달 글자만 보니 도메인도 없다.
//
// 단언은 adminStats의 chartValues.utils.test.ts에서 그대로 옮긴 셋이다.

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
