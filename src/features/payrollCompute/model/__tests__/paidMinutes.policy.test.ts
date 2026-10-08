import { paidMinutes } from "@/features/payrollCompute/model/paidMinutes.policy";

const NINE_HOUR_DAY = { starts_at: "10:00:00", ends_at: "19:00:00" };

describe("paidMinutes — 배정 시간은 day.starts_at~ends_at 그대로다(PAY-004)", () => {
  it("휴게시간을 따로 빼지 않은 날 시간이 그대로 더해진다", () => {
    const minutes = paidMinutes({
      assignments: [{ id: "a1" }],
      day: NINE_HOUR_DAY,
      adjustments: [],
      rehearsals: [],
    });

    expect(minutes).toBe(540);
  });
});

describe("paidMinutes — 조정이 여럿이면 adjustedAt이 가장 늦은 행만 쓴다", () => {
  it("배열 순서가 아니라 adjustedAt 최신 행의 분을 쓴다", () => {
    const minutes = paidMinutes({
      assignments: [{ id: "a1" }],
      day: NINE_HOUR_DAY,
      adjustments: [
        { minutes: 30, adjustedAt: "2026-09-10T09:00:00.000Z" },
        { minutes: -540, adjustedAt: "2026-09-10T11:00:00.000Z" },
        { minutes: 60, adjustedAt: "2026-09-10T10:00:00.000Z" },
      ],
      rehearsals: [],
    });

    expect(minutes).toBe(0);
  });
});

describe("paidMinutes — 리허설은 시각 갈래와 건수 갈래를 모두 더한다(PAY-028)", () => {
  it("시각으로 넣은 리허설과 건수로 넣은 리허설이 같이 있으면 둘 다 더한다", () => {
    const minutes = paidMinutes({
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

describe("paidMinutes — 배정·조정·리허설이 셋 다 없으면 0분이다", () => {
  it("아무것도 없는 날은 0분이다", () => {
    const minutes = paidMinutes({
      assignments: [],
      day: null,
      adjustments: [],
      rehearsals: [],
    });

    expect(minutes).toBe(0);
  });
});
