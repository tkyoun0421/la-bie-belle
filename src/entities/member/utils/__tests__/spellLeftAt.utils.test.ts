import { spellLeftAt } from "@/entities/member/utils/spellLeftAt.utils";

describe("spellLeftAt — 해를 넘긴 기록이 쌓이는 자리라 연도가 붙는다", () => {
  it("「2026년 6월 30일」이다", () => {
    expect(spellLeftAt("2026-06-30T05:00:00.000Z")).toBe("2026년 6월 30일");
  });

  it("UTC로는 전날인 자정 뒤도 홀의 날짜로 적는다", () => {
    expect(spellLeftAt("2026-06-30T16:00:00.000Z")).toBe("2026년 7월 1일");
  });

  it("앞 0을 떼고 적는다", () => {
    expect(spellLeftAt("2026-01-05T05:00:00.000Z")).toBe("2026년 1월 5일");
  });
});
