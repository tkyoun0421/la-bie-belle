// 구현 대상: src/features/payrollCompute/model/payrollDays.policy.ts
//
// payrollDays(input) — assignments·days·adjustments·rehearsals의 날짜 합집합을 훑어
// 날마다 paidMinutes·wageAt·dayAmount를 부르고, 결근이면(entities/attendance의
// getAttendanceStatus가 'absent'를 내면) 0원·kind='absent'로 낸다(plan AC-06,
// PAY-002·PAY-003·PAY-007·PAY-020·PAY-028). wageAt이 null인 날은 결과에서 뺀다.
//
// 배정이 없는 날은 attendance 판정 자체를 안 건다 — 배정 없이는 결근일 수 없다.

import {
  payrollDays,
  payrollViewDays,
} from "@/features/payrollCompute/model/payrollDays.policy";

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

describe("payrollDays — 그날 시급이 없으면 'wage-pending'으로 선다(결과에서 안 뺀다)", () => {
  it("첫 시급 행보다 이른 날은 분을 채운 채 금액 0원·kind='wage-pending'으로 뜬다", () => {
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

    expect(result.find((day) => day.date === WORK_DATE)).toEqual({
      date: WORK_DATE,
      minutes: 540,
      amount: 0,
      kind: "wage-pending",
    });
  });
});

// payrollViewDays(source) — 세 키(급여 재료·근무표·리허설)를 payrollDays의 입력으로 접는다.
// 화면이 profileId 하나만 들고 부르는 자리라 셋 중 하나가 비어도 죽지 않아야 하고, 날짜는
// 세 갈래(배정·조정·리허설)의 합집합이어야 하고, 금액 계산 자체는 payrollDays를 그대로 불러야
// 한다(다시 짜면 두 벌이 서서 어긋날 수 있다).

describe("payrollViewDays — 근무표(days)가 비어도 리허설만으로 죽지 않는다", () => {
  it("배정도 조정도 없이 리허설만 있으면 그 날짜가 뜬다", () => {
    const rehearsalDate = "2026-09-11";
    const result = payrollViewDays({
      profileId: "profile-1",
      days: [],
      rates: [],
      adjustments: [],
      excuses: [],
      rehearsals: [
        {
          work_date: rehearsalDate,
          starts_at: "14:00",
          ends_at: "16:00",
          count: null,
        },
      ],
      now: "2026-09-11T00:00:00.000Z",
    });

    expect(result).toEqual([
      {
        date: rehearsalDate,
        minutes: 120,
        amount: 0,
        kind: "wage-pending",
        position: null,
        startsAt: null,
        endsAt: null,
        isEducation: false,
        overtimeMinutes: 0,
        rehearsalMinutes: 120,
        attendance: null,
      },
    ]);
  });
});

describe("payrollViewDays — 리허설이 비어도 배정만으로 죽지 않는다", () => {
  it("배정과 출근만 있어도 그 날짜가 배정 시간대로 뜬다", () => {
    const dayId = "day-view-1";
    const workDate = "2026-09-10";

    const result = payrollViewDays({
      profileId: "profile-1",
      days: [
        {
          id: dayId,
          work_date: workDate,
          starts_at: "10:00:00",
          ends_at: "19:00:00",
          opened_at: "2026-09-01T00:00:00.000Z",
          slots: [],
          assignments: [
            {
              id: "assignment-1",
              slot_id: null,
              position: "hall",
              kind: "regular",
              profile_id: "profile-1",
              ended_at: null,
              profiles: null,
            },
          ],
          check_ins: [
            {
              id: "check-in-1",
              profile_id: "profile-1",
              checked_at: "2026-09-10T01:00:00.000Z",
              reported_at: "2026-09-10T01:00:00.000Z",
              received_at: "2026-09-10T01:00:00.000Z",
            },
          ],
        },
      ],
      rates: [
        {
          effective_date: "2026-08-01",
          amount: 12000,
          profile_id: "profile-1",
        },
      ],
      adjustments: [],
      excuses: [],
      rehearsals: [],
      now: "2026-09-10T01:00:00.000Z",
    });

    expect(result.find((day) => day.date === workDate)).toMatchObject({
      minutes: 540,
      amount: 108000,
      kind: "normal",
      position: "hall",
      startsAt: "10:00",
      endsAt: "19:00",
      rehearsalMinutes: 0,
    });
  });
});

describe("payrollViewDays — 시급(rates)이 비어도 안 죽고 wage-pending으로 뜬다", () => {
  it("배정만 있고 시급이 없으면 금액 0원·kind='wage-pending'이다", () => {
    const dayId = "day-view-2";
    const workDate = "2026-09-10";

    const result = payrollViewDays({
      profileId: "profile-1",
      days: [
        {
          id: dayId,
          work_date: workDate,
          starts_at: "10:00:00",
          ends_at: "19:00:00",
          opened_at: "2026-09-01T00:00:00.000Z",
          slots: [],
          assignments: [
            {
              id: "assignment-2",
              slot_id: null,
              position: "hall",
              kind: "regular",
              profile_id: "profile-1",
              ended_at: null,
              profiles: null,
            },
          ],
          check_ins: [
            {
              id: "check-in-2",
              profile_id: "profile-1",
              checked_at: "2026-09-10T01:00:00.000Z",
              reported_at: "2026-09-10T01:00:00.000Z",
              received_at: "2026-09-10T01:00:00.000Z",
            },
          ],
        },
      ],
      rates: [],
      adjustments: [],
      excuses: [],
      rehearsals: [],
      now: "2026-09-10T01:00:00.000Z",
    });

    expect(result.find((day) => day.date === workDate)).toMatchObject({
      minutes: 540,
      amount: 0,
      kind: "wage-pending",
    });
  });
});

describe("payrollViewDays — 배정·조정·리허설 세 갈래의 날짜가 합집합으로 뜬다", () => {
  it("배정만 있는 날, 리허설만 있는 날, 조정만 있는 날 셋이 모두 결과에 선다", () => {
    const assignedDate = "2026-09-10";
    const rehearsalOnlyDate = "2026-09-11";
    const adjustmentOnlyDate = "2026-09-12";

    const result = payrollViewDays({
      profileId: "profile-1",
      days: [
        {
          id: "day-assigned",
          work_date: assignedDate,
          starts_at: "10:00:00",
          ends_at: "19:00:00",
          opened_at: "2026-09-01T00:00:00.000Z",
          slots: [],
          assignments: [
            {
              id: "assignment-3",
              slot_id: null,
              position: "hall",
              kind: "regular",
              profile_id: "profile-1",
              ended_at: null,
              profiles: null,
            },
          ],
          check_ins: [
            {
              id: "check-in-3",
              profile_id: "profile-1",
              checked_at: "2026-09-10T01:00:00.000Z",
              reported_at: "2026-09-10T01:00:00.000Z",
              received_at: "2026-09-10T01:00:00.000Z",
            },
          ],
        },
        {
          id: "day-adjustment-only",
          work_date: adjustmentOnlyDate,
          starts_at: "10:00:00",
          ends_at: "19:00:00",
          opened_at: "2026-09-01T00:00:00.000Z",
          slots: [],
          assignments: [],
          check_ins: [],
        },
      ],
      rates: [
        {
          effective_date: "2026-08-01",
          amount: 12000,
          profile_id: "profile-1",
        },
      ],
      adjustments: [
        {
          day_id: "day-adjustment-only",
          minutes: 60,
          adjusted_at: "2026-09-12T00:00:00.000Z",
          profile_id: "profile-1",
        },
      ],
      excuses: [],
      rehearsals: [
        {
          work_date: rehearsalOnlyDate,
          starts_at: "14:00",
          ends_at: "16:00",
          count: null,
        },
      ],
      now: "2026-09-12T00:00:00.000Z",
    });

    expect(result.map((day) => day.date).sort()).toEqual(
      [assignedDate, rehearsalOnlyDate, adjustmentOnlyDate].sort(),
    );
  });
});

describe("payrollViewDays — 교육 배정(kind: 'training')은 isEducation이 참이다", () => {
  it("DB check 제약과 같은 kind 값 'training'이면 그 날이 isEducation: true로 선다", () => {
    const dayId = "day-education-1";
    const workDate = "2026-09-15";

    const result = payrollViewDays({
      profileId: "profile-1",
      days: [
        {
          id: dayId,
          work_date: workDate,
          starts_at: "10:00:00",
          ends_at: "19:00:00",
          opened_at: "2026-09-01T00:00:00.000Z",
          slots: [],
          assignments: [
            {
              id: "assignment-education-1",
              slot_id: null,
              position: "hall",
              kind: "training",
              profile_id: "profile-1",
              ended_at: null,
              profiles: null,
            },
          ],
          check_ins: [
            {
              id: "check-in-education-1",
              profile_id: "profile-1",
              checked_at: "2026-09-15T01:00:00.000Z",
              reported_at: "2026-09-15T01:00:00.000Z",
              received_at: "2026-09-15T01:00:00.000Z",
            },
          ],
        },
      ],
      rates: [
        {
          effective_date: "2026-08-01",
          amount: 12000,
          profile_id: "profile-1",
        },
      ],
      adjustments: [],
      excuses: [],
      rehearsals: [],
      now: "2026-09-15T01:00:00.000Z",
    });

    expect(result.find((day) => day.date === workDate)?.isEducation).toBe(true);
  });
});

describe("payrollViewDays — payrollDays를 다시 짜지 않고 그대로 부른다", () => {
  it("같은 배정·시급 입력이면 date·minutes·amount·kind가 payrollDays 결과와 같다", () => {
    const dayId = "day-parity";
    const workDate = "2026-09-10";
    const profileId = "profile-1";
    const checkIn = {
      checked_at: "2026-09-10T01:00:00.000Z",
      reported_at: "2026-09-10T01:00:00.000Z",
      received_at: "2026-09-10T01:00:00.000Z",
    };
    const now = "2026-09-10T01:00:00.000Z";
    const rate = { effective_date: "2026-08-01", amount: 12000 };

    const viewResult = payrollViewDays({
      profileId,
      days: [
        {
          id: dayId,
          work_date: workDate,
          starts_at: "10:00:00",
          ends_at: "19:00:00",
          opened_at: "2026-09-01T00:00:00.000Z",
          slots: [],
          assignments: [
            {
              id: "assignment-parity",
              slot_id: null,
              position: "hall",
              kind: "regular",
              profile_id: profileId,
              ended_at: null,
              profiles: null,
            },
          ],
          check_ins: [
            { id: "check-in-parity", profile_id: profileId, ...checkIn },
          ],
        },
      ],
      rates: [{ ...rate, profile_id: profileId }],
      adjustments: [],
      excuses: [],
      rehearsals: [],
      now,
    }).map((day) => ({
      date: day.date,
      minutes: day.minutes,
      amount: day.amount,
      kind: day.kind,
    }));

    const rawResult = payrollDays({
      days: [
        {
          id: dayId,
          work_date: workDate,
          starts_at: "10:00:00",
          ends_at: "19:00:00",
        },
      ],
      assignments: [{ day_id: dayId }],
      adjustments: [],
      checkIns: [{ day_id: dayId, ...checkIn }],
      excuses: [],
      rehearsals: [],
      rates: [rate],
      now,
    });

    expect(viewResult).toEqual(rawResult);
  });
});
