// 구현 대상: src/screens/stats/model/moneyLabel.ts (아직 없다)
//
// tenThousandWonLabel(amount) — 근무자 급여 탭 추이 그래프의 값이다(plan
// stats-worker AC-01, spec AC-04). 「1,296,000원」이 그래프에서는 「130만」이
// 된다 — 만 단위로 반올림해 줄인다(stats.md 「그래프 값 — 급여」).

import { tenThousandWonLabel } from "@/screens/stats/model/moneyLabel";

describe("tenThousandWonLabel — 그래프 값은 만 단위로 줄여 적는다(stats.md 「내 급여」)", () => {
  it("1,296,000원은 정확히 129.6만이라 반올림해 '130만'이다", () => {
    expect(tenThousandWonLabel(1_296_000)).toBe("130만");
  });

  it("1,250,000원처럼 딱 떨어지면 '125만'이다", () => {
    expect(tenThousandWonLabel(1_250_000)).toBe("125만");
  });

  it("반올림 경계 — 1,255,000원(125.5만)은 올림해 '126만'이다", () => {
    expect(tenThousandWonLabel(1_255_000)).toBe("126만");
  });

  it("반올림 경계 — 1,244,999원(124.4999만)은 내림해 '124만'이다", () => {
    expect(tenThousandWonLabel(1_244_999)).toBe("124만");
  });

  it("0원은 '0만'이다", () => {
    expect(tenThousandWonLabel(0)).toBe("0만");
  });
});
