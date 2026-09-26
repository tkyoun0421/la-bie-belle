import {
  dayBandCheckInMarkRatio,
  dayBandFillRatio,
  type ShiftWindow,
} from "@/shared/lib/day-band";

const SHIFT: ShiftWindow = {
  start: new Date("2026-09-12T10:00:00+09:00"),
  end: new Date("2026-09-12T19:00:00+09:00"),
};

function at(hhmm: string): Date {
  return new Date(`2026-09-12T${hhmm}:00+09:00`);
}

describe("dayBandFillRatio — 하루 띠 채움 비율 (AC-05)", () => {
  it("확정 전이면 근무 중이어도 값이 없다", () => {
    expect(dayBandFillRatio(SHIFT, at("14:00"), false)).toBeNull();
  });

  it("근무 전이면 0이다", () => {
    expect(dayBandFillRatio(SHIFT, at("09:40"), true)).toBe(0);
  });

  it("근무 시작 정각도 0이다 — 경계", () => {
    expect(dayBandFillRatio(SHIFT, at("10:00"), true)).toBe(0);
  });

  it("근무 중이면 지난 만큼의 비율이다", () => {
    // 10:00 시작 9시간 근무, 12:15은 2시간 15분(=2.25시간) 경과 → 25%
    expect(dayBandFillRatio(SHIFT, at("12:15"), true)).toBe(25);
  });

  it("근무 끝 정각은 100이다 — 경계", () => {
    expect(dayBandFillRatio(SHIFT, at("19:00"), true)).toBe(100);
  });

  it("근무가 끝난 뒤에도 100에서 멈춘다", () => {
    expect(dayBandFillRatio(SHIFT, at("22:00"), true)).toBe(100);
  });
});

describe("dayBandCheckInMarkRatio — 인증 눈금 (AC-05)", () => {
  it("정시에 찍으면 0이다", () => {
    expect(dayBandCheckInMarkRatio(SHIFT, at("10:00"))).toBe(0);
  });

  it("일찍 찍어도 0에 물린다 — 음수 자리를 안 낸다", () => {
    // 인증 창은 근무 시작 한 시간 전에 열린다(9:40 인증)
    expect(dayBandCheckInMarkRatio(SHIFT, at("09:40"))).toBe(0);
  });

  it("늦게 찍으면 지난 만큼의 비율이다", () => {
    // 10:54 인증 = 54분 경과, 9시간(540분) 중 10%
    expect(dayBandCheckInMarkRatio(SHIFT, at("10:54"))).toBe(10);
  });

  it("안 찍었으면 눈금이 없다", () => {
    expect(dayBandCheckInMarkRatio(SHIFT, null)).toBeNull();
  });
});
