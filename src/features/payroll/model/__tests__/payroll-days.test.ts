// 구현 대상: src/features/payroll/model/payroll-days.ts
//
// payrollDays(input) — assignments·days·adjustments·rehearsals의 날짜 합집합을 훑어
// 날마다 dayMinutes·wageAt·dayAmount를 부르고, 결근이면(entities/attendance의
// getAttendanceStatus가 'absent'를 내면) 0원·kind='absent'로 낸다(plan AC-06,
// PAY-002·PAY-003·PAY-007·PAY-020·PAY-028). wageAt이 null인 날은 결과에서 뺀다.
//
// 배정이 없는 날은 attendance 판정 자체를 안 건다 — 배정 없이는 결근일 수 없다.

import { payrollDays } from "@/features/payroll/model/payroll-days";

const RATES = [{ effective_date: "2026-08-01", amount: 12000 }];

const DAY_ID = "day-1";
const WORK_DATE = "2026-09-10";
const NINE_HOUR_SHIFT = { starts_at: "10:00:00", ends_at: "19:00:00" };

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    days: [],
    assignments: [],
    adjustments: [],
    checkIns: [],
    excuses: [],
    rehearsals: [],
    rates: RATES,
    now: "2026-09-10T01:00:00.000Z",
    ...overrides,
  };
}

describe("payrollDays — 배정만 있는 날도 결과에 뜬다(날짜 합집합)", () => {
  it("배정·날이 있고 정상 출근이면 그 날짜가 배정 시간대로 결과에 선다", () => {
    const result = payrollDays(
      baseInput({
        days: [{ id: DAY_ID, work_date: WORK_DATE, ...NINE_HOUR_SHIFT }],
        assignments: [{ day_id: DAY_ID }],
        checkIns: [
          {
            day_id: DAY_ID,
            checked_at: "2026-09-10T01:00:00.000Z",
            reported_at: "2026-09-10T01:00:00.000Z",
            received_at: "2026-09-10T01:00:00.000Z",
          },
        ],
      }),
    );

    expect(result.find((day) => day.date === WORK_DATE)).toEqual({
      date: WORK_DATE,
      minutes: 540,
      amount: 108000,
      kind: "normal",
    });
  });
});

describe("payrollDays — 리허설만 있는 날도 결과에 뜬다(날짜 합집합)", () => {
  it("배정이 없어도 리허설이 있는 날짜는 그 시간만큼 결과에 선다", () => {
    const rehearsalOnlyDate = "2026-09-11";
    const result = payrollDays(
      baseInput({
        rehearsals: [
          {
            work_date: rehearsalOnlyDate,
            starts_at: "14:00",
            ends_at: "16:00",
            count: null,
          },
        ],
        now: "2026-09-11T00:00:00.000Z",
      }),
    );

    expect(result.find((day) => day.date === rehearsalOnlyDate)).toEqual({
      date: rehearsalOnlyDate,
      minutes: 120,
      amount: 24000,
      kind: "normal",
    });
  });
});

describe("payrollDays — 조정만 있는 날도 결과에 뜬다(날짜 합집합)", () => {
  it("배정이 없어도 조정이 있는 날짜는 그 분만큼 결과에 선다", () => {
    const adjustmentOnlyDayId = "day-2";
    const adjustmentOnlyDate = "2026-09-12";
    const result = payrollDays(
      baseInput({
        days: [
          {
            id: adjustmentOnlyDayId,
            work_date: adjustmentOnlyDate,
            ...NINE_HOUR_SHIFT,
          },
        ],
        adjustments: [
          {
            day_id: adjustmentOnlyDayId,
            minutes: 60,
            adjusted_at: "2026-09-12T00:00:00.000Z",
          },
        ],
        now: "2026-09-12T00:00:00.000Z",
      }),
    );

    expect(result.find((day) => day.date === adjustmentOnlyDate)).toEqual({
      date: adjustmentOnlyDate,
      minutes: 60,
      amount: 12000,
      kind: "normal",
    });
  });
});

describe("payrollDays — 조정 없는 결근과 조정 음수로 0이 된 결근이 같은 결과다", () => {
  it("결근 판정이면 조정 유무와 무관하게 0원·absent다", () => {
    const noCheckInNoExcuse = baseInput({
      days: [{ id: DAY_ID, work_date: WORK_DATE, ...NINE_HOUR_SHIFT }],
      assignments: [{ day_id: DAY_ID }],
      now: "2026-09-20T00:00:00.000Z",
    });

    const withCancellingAdjustment = baseInput({
      days: [{ id: DAY_ID, work_date: WORK_DATE, ...NINE_HOUR_SHIFT }],
      assignments: [{ day_id: DAY_ID }],
      adjustments: [
        {
          day_id: DAY_ID,
          minutes: -540,
          adjusted_at: "2026-09-11T00:00:00.000Z",
        },
      ],
      now: "2026-09-20T00:00:00.000Z",
    });

    const withoutAdjustment = payrollDays(noCheckInNoExcuse).find(
      (day) => day.date === WORK_DATE,
    );
    const withAdjustment = payrollDays(withCancellingAdjustment).find(
      (day) => day.date === WORK_DATE,
    );

    expect(withoutAdjustment).toEqual({
      date: WORK_DATE,
      minutes: 0,
      amount: 0,
      kind: "absent",
    });
    expect(withAdjustment).toEqual(withoutAdjustment);
  });
});

describe("payrollDays — 지각은 급여를 안 건드린다(PAY-003)", () => {
  it("지각으로 판정돼도 배정 시간 그대로 센다", () => {
    const result = payrollDays(
      baseInput({
        days: [{ id: DAY_ID, work_date: WORK_DATE, ...NINE_HOUR_SHIFT }],
        assignments: [{ day_id: DAY_ID }],
        checkIns: [
          {
            day_id: DAY_ID,
            checked_at: "2026-09-10T01:10:01.000Z",
            reported_at: "2026-09-10T01:10:01.000Z",
            received_at: "2026-09-10T01:10:01.000Z",
          },
        ],
        now: "2026-09-10T01:10:01.000Z",
      }),
    );

    expect(result.find((day) => day.date === WORK_DATE)).toEqual({
      date: WORK_DATE,
      minutes: 540,
      amount: 108000,
      kind: "normal",
    });
  });
});

describe("payrollDays — 출근 인정도 배정 시간 그대로 센다(PAY-003)", () => {
  it("사유가 승인되면 배정 시간대로 급여가 난다", () => {
    const result = payrollDays(
      baseInput({
        days: [{ id: DAY_ID, work_date: WORK_DATE, ...NINE_HOUR_SHIFT }],
        assignments: [{ day_id: DAY_ID }],
        excuses: [
          {
            day_id: DAY_ID,
            submitted_at: "2026-09-10T02:00:00.000Z",
            decided_at: "2026-09-10T03:00:00.000Z",
            decision: "approved",
          },
        ],
        now: "2026-09-20T00:00:00.000Z",
      }),
    );

    expect(result.find((day) => day.date === WORK_DATE)).toEqual({
      date: WORK_DATE,
      minutes: 540,
      amount: 108000,
      kind: "normal",
    });
  });
});

describe("payrollDays — 교육 배정도 같은 규칙으로 급여가 난다(PAY-007)", () => {
  it("배정 kind가 education이어도 정규 배정과 같은 시간·금액을 낸다", () => {
    const result = payrollDays(
      baseInput({
        days: [{ id: DAY_ID, work_date: WORK_DATE, ...NINE_HOUR_SHIFT }],
        assignments: [{ day_id: DAY_ID, kind: "education" }],
        checkIns: [
          {
            day_id: DAY_ID,
            checked_at: "2026-09-10T01:00:00.000Z",
            reported_at: "2026-09-10T01:00:00.000Z",
            received_at: "2026-09-10T01:00:00.000Z",
          },
        ],
      }),
    );

    expect(result.find((day) => day.date === WORK_DATE)).toEqual({
      date: WORK_DATE,
      minutes: 540,
      amount: 108000,
      kind: "normal",
    });
  });
});

describe("payrollDays — 그날 시급이 없으면 결과에서 뺀다(wageAt이 null)", () => {
  it("첫 시급 행보다 이른 날은 목록에 안 뜬다", () => {
    const result = payrollDays(
      baseInput({
        days: [{ id: DAY_ID, work_date: WORK_DATE, ...NINE_HOUR_SHIFT }],
        assignments: [{ day_id: DAY_ID }],
        checkIns: [
          {
            day_id: DAY_ID,
            checked_at: "2026-09-10T01:00:00.000Z",
            reported_at: "2026-09-10T01:00:00.000Z",
            received_at: "2026-09-10T01:00:00.000Z",
          },
        ],
        rates: [{ effective_date: "2026-10-01", amount: 12000 }],
      }),
    );

    expect(result.find((day) => day.date === WORK_DATE)).toBeUndefined();
  });
});
