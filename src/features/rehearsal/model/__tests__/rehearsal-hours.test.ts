// 구현 대상: src/features/rehearsal/model/rehearsal-hours.ts
//
// 리허설 시간 환산이다(plan AC-04, SCH-023) — 건수 갈래는 count*60분, 시각 갈래는
// ends_at - starts_at. 1건이 1시간이다. dayTotal·monthTotal은 같은 계산을 여러 행에 걸쳐
// { count, minutes }로 더한다 — 시각으로 넣은 것과 건수로 넣은 것을 한 숫자로 더한다
// (rehearsal.md 「달력 짜임」).

import {
  dayTotal,
  monthTotal,
  rehearsalHours,
  type RehearsalRow,
} from "@/features/rehearsal/model/rehearsal-hours";

const TIME_ROW: RehearsalRow = {
  starts_at: "14:00",
  ends_at: "16:00",
  count: null,
};

const COUNT_ROW: RehearsalRow = {
  starts_at: null,
  ends_at: null,
  count: 3,
};

describe("rehearsalHours — 1건이 1시간이다", () => {
  it("건수 갈래는 count * 60분이다", () => {
    expect(rehearsalHours(COUNT_ROW)).toBe(180);
  });

  it("시각 갈래는 끝에서 시작을 뺀 분이다", () => {
    expect(rehearsalHours(TIME_ROW)).toBe(120);
  });
});

describe("dayTotal — 그날 행을 건수와 분으로 더한다", () => {
  it("행이 없으면 0건 0분이다", () => {
    expect(dayTotal([])).toEqual({ count: 0, minutes: 0 });
  });

  it("시각 갈래 한 줄은 1건으로 센다", () => {
    expect(dayTotal([TIME_ROW])).toEqual({ count: 1, minutes: 120 });
  });

  it("건수 갈래 한 줄은 그 건수만큼으로 센다", () => {
    expect(dayTotal([COUNT_ROW])).toEqual({ count: 3, minutes: 180 });
  });
});

describe("monthTotal — 시각으로 넣은 것과 건수로 넣은 것을 한 숫자로 더한다", () => {
  it("두 갈래가 섞여도 건수와 분을 합쳐 낸다", () => {
    expect(monthTotal([TIME_ROW, COUNT_ROW])).toEqual({
      count: 4,
      minutes: 300,
    });
  });

  it("행이 없으면 0건 0분이다", () => {
    expect(monthTotal([])).toEqual({ count: 0, minutes: 0 });
  });
});
