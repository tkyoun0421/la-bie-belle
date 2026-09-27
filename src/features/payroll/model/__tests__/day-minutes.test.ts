// 구현 대상: src/features/payroll/model/day-minutes.ts
//
// dayMinutes({ assignments, day, adjustments, rehearsals }) — 그날 총 분을 낸다
// (plan AC-06). 배정 시간은 day.starts_at~ends_at 그대로고 휴게를 안 뺀다(PAY-004).
// 조정은 이력 중 adjusted_at이 가장 늦은 행의 분만 쓴다. 리허설은 시각 갈래·건수 갈래를
// 모두 더한다(PAY-028, rehearsalHours가 두 갈래를 하나의 분으로 낸다).

import { dayMinutes } from "@/features/payroll/model/day-minutes";

const NINE_HOUR_DAY = { starts_at: "10:00:00", ends_at: "19:00:00" };

describe("dayMinutes — 배정 시간은 day.starts_at~ends_at 그대로다(PAY-004)", () => {
  it("휴게시간을 따로 빼지 않은 날 시간이 그대로 더해진다", () => {
    const minutes = dayMinutes({
      assignments: [{ id: "a1" }],
      day: NINE_HOUR_DAY,
      adjustments: [],
      rehearsals: [],
    });

    expect(minutes).toBe(540);
  });
});

describe("dayMinutes — 조정이 여럿이면 adjusted_at이 가장 늦은 행만 쓴다", () => {
  it("배열 순서가 아니라 adjusted_at 최신 행의 분을 쓴다", () => {
    const minutes = dayMinutes({
      assignments: [{ id: "a1" }],
      day: NINE_HOUR_DAY,
      adjustments: [
        { minutes: 30, adjusted_at: "2026-09-10T09:00:00.000Z" },
        { minutes: -540, adjusted_at: "2026-09-10T11:00:00.000Z" },
        { minutes: 60, adjusted_at: "2026-09-10T10:00:00.000Z" },
      ],
      rehearsals: [],
    });

    expect(minutes).toBe(0);
  });
});

describe("dayMinutes — 리허설은 시각 갈래와 건수 갈래를 모두 더한다(PAY-028)", () => {
  it("시각으로 넣은 리허설과 건수로 넣은 리허설이 같이 있으면 둘 다 더한다", () => {
    const minutes = dayMinutes({
      assignments: [{ id: "a1" }],
      day: NINE_HOUR_DAY,
      adjustments: [],
      rehearsals: [
        { starts_at: "20:00", ends_at: "22:00", count: null },
        { starts_at: null, ends_at: null, count: 1 },
      ],
    });

    expect(minutes).toBe(540 + 120 + 60);
  });
});

describe("dayMinutes — 배정·조정·리허설이 셋 다 없으면 0분이다", () => {
  it("아무것도 없는 날은 0분이다", () => {
    const minutes = dayMinutes({
      assignments: [],
      day: null,
      adjustments: [],
      rehearsals: [],
    });

    expect(minutes).toBe(0);
  });
});
