// 구현 대상: src/screens/rehearsal/utils/spellTotal.utils.ts
//
// 달 줄의 합계 문안이다(rehearsal.md 「문안」) — 「3건 · 5시간」꼴이고 0건이면 자리가 빈다.
// 분이 60 배수가 아니면 「1시간 30분」처럼 분까지 적는다.

import { spellTotal } from "@/screens/rehearsal/utils/spellTotal.utils";

describe("spellTotal — 0건이면 자리가 빈다", () => {
  it("count가 0이면 빈 문자열이다", () => {
    expect(spellTotal({ count: 0, minutes: 0 })).toBe("");
  });
});

describe("spellTotal — 「N건 · N시간」꼴이다", () => {
  it("3건 300분이면 「3건 · 5시간」이다", () => {
    expect(spellTotal({ count: 3, minutes: 300 })).toBe("3건 · 5시간");
  });
});

describe("spellTotal — 분이 60 배수가 아니면 분까지 적는다", () => {
  it("1건 90분이면 「1건 · 1시간 30분」이다", () => {
    expect(spellTotal({ count: 1, minutes: 90 })).toBe("1건 · 1시간 30분");
  });
});
