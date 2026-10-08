import { kstToday } from "@/shared/lib/kstToday.lib";

describe("kstToday — 기기 시간대와 무관하게 KST 자정 경계로 오늘을 읽는다", () => {
  it("UTC 14:59는 아직 전날이다", () => {
    expect(kstToday(new Date("2026-10-02T14:59:00Z"))).toBe("2026-10-02");
  });

  it("UTC 15:00은 이미 다음날이다", () => {
    expect(kstToday(new Date("2026-10-02T15:00:00Z"))).toBe("2026-10-03");
  });
});
