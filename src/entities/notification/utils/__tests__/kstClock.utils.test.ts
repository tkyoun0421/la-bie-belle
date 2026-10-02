/**
 * 구현 대상: src/entities/notification/utils/kstClock.utils.ts
 *
 * 알림의 시각을 적는 두 자리(목록 줄과 푸시 아래줄)가 같은 꼴을 써야 해서 한 손이다.
 */

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
