const { spellKstClock } =
  await import("@/entities/notification/utils/kstClock.utils");

describe("spellKstClock — 그 순간을 KST 24시간제 시·분으로 적는다", () => {
  it("오전은 두 자리로 적는다", () => {
    expect(spellKstClock("2026-10-03T00:05:00+09:00")).toBe("00:05");
  });

  it("오후도 24시간제다 — 21시는 09시가 아니다", () => {
    expect(spellKstClock("2026-10-03T21:30:00+09:00")).toBe("21:30");
  });

  it("기기 시간대가 어디든 KST로 읽는다", () => {
    expect(spellKstClock("2026-10-03T00:00:00Z")).toBe("09:00");
  });

  it("Date를 그대로 받는다", () => {
    expect(spellKstClock(new Date("2026-10-03T00:00:00Z"))).toBe("09:00");
  });
});
