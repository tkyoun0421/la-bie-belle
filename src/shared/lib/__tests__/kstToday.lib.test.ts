// 구현 대상: src/shared/lib/kstToday.lib.ts
//
// 인자를 받으면 그 순간을, 안 받으면 제가 부른 `new Date()`를 KST 자정 경계로 읽는다.
// 경계는 UTC 15:00이 당일 0시라 14:59Z는 전날, 15:00Z는 당일이다.

import { kstToday } from "@/shared/lib/kstToday.lib";

describe("kstToday — 기기 시간대와 무관하게 KST 자정 경계로 오늘을 읽는다", () => {
  it("UTC 14:59는 아직 전날이다", () => {
    expect(kstToday(new Date("2026-10-02T14:59:00Z"))).toBe("2026-10-02");
  });

  it("UTC 15:00은 이미 다음날이다", () => {
    expect(kstToday(new Date("2026-10-02T15:00:00Z"))).toBe("2026-10-03");
  });
});
