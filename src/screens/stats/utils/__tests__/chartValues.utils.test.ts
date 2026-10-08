import type { PayrollMonth } from "@/entities/payroll/api/payroll.dto";
import type { Rehearsal } from "@/entities/rehearsal/api/rehearsal.dto";
import type { ScheduleAssignment } from "@/entities/schedule/api/schedule.dto";
import type { ScheduleDay } from "@/entities/schedule/api/schedule.dto";
import type { WorkMonth } from "@/entities/schedule/services/useWorkMonthsQuery";
import type { AttendanceMonth } from "@/features/stats/services/useAttendanceMonthsQuery";
import {
  joinPayrollByMonth,
  myAttendanceValues,
  myPayrollDaysOfMonth,
  myPayrollValues,
  myWorkValues,
} from "@/screens/stats/utils/chartValues.utils";

const PROFILE_ID = "profile-1";

function assignment(overrides: Partial<ScheduleAssignment> = {}) {
  return {
    id: "assignment-1",
    slot_id: null,
    position: "hall",
    kind: "regular",
    profile_id: PROFILE_ID,
    ended_at: null,
    profiles: null,
    ...overrides,
  };
}

function scheduleDay(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    id: "day-1",
    work_date: "2026-08-10",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    opened_at: "2026-08-01T00:00:00.000Z",
    slots: [],
    check_ins: [],
    assignments: [],
    ...overrides,
  };
}

describe("myWorkValues — 근무표 자체가 안 열린 달은 Map에서 빠진다", () => {
  it("근무일이 있는 달만 오르고 빈 달(days: [])은 키가 없다", () => {
    const loaded: WorkMonth[] = [
      {
        month: "2026-08",
        days: [scheduleDay({ assignments: [assignment()] })],
      },
      { month: "2026-09", days: [] },
    ];

    const values = myWorkValues(loaded, PROFILE_ID);

    expect(values.get("2026-08")).toBe(480);
    expect(values.has("2026-09")).toBe(false);
  });

  it("loaded가 undefined면 빈 Map이다", () => {
    expect(myWorkValues(undefined, PROFILE_ID).size).toBe(0);
  });
});

describe("myWorkValues — 근무표는 열렸지만 내가 안 나온 달은 0으로 남는다", () => {
  it("그달 배정이 남의 것뿐이면 내 합은 0이고 키는 그대로 있다", () => {
    const loaded: WorkMonth[] = [
      {
        month: "2026-08",
        days: [
          scheduleDay({
            assignments: [assignment({ profile_id: "다른-사람" })],
          }),
        ],
      },
    ];

    const values = myWorkValues(loaded, PROFILE_ID);

    expect(values.has("2026-08")).toBe(true);
    expect(values.get("2026-08")).toBe(0);
  });
});

describe("myAttendanceValues — 내 배정이 그달에 없으면 출근율을 못 구해 Map에서 빠진다", () => {
  it("넷이 다 0인 달은 키가 없다", () => {
    const loaded: AttendanceMonth[] = [
      {
        month: "2026-08",
        days: [],
        attendance: { checkIns: [], excuseStatuses: [] },
      },
    ];

    const values = myAttendanceValues(
      loaded,
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
    );

    expect(values.has("2026-08")).toBe(false);
  });

  it("loaded가 undefined면 빈 Map이다", () => {
    expect(
      myAttendanceValues(undefined, PROFILE_ID, "2026-08-31T00:00:00.000Z")
        .size,
    ).toBe(0);
  });
});

describe("myAttendanceValues — 출근율은 entities/attendance의 attendanceRate 공식과 같다", () => {
  it("출근 1 · 지각 1이면 50%다(지각도 인증이 돈 것이라 분모에 든다)", () => {
    const day = scheduleDay({
      id: "day-a",
      work_date: "2026-08-05",
      starts_at: "10:00:00",
      ends_at: "18:00:00",
      assignments: [assignment({ id: "a1" })],
    });
    const lateDay = scheduleDay({
      id: "day-b",
      work_date: "2026-08-06",
      starts_at: "10:00:00",
      ends_at: "18:00:00",
      assignments: [assignment({ id: "a2" })],
    });

    const loaded: AttendanceMonth[] = [
      {
        month: "2026-08",
        days: [day, lateDay],
        attendance: {
          checkIns: [
            {
              id: "check-a",
              method: "qr",
              day_id: "day-a",
              profile_id: PROFILE_ID,
              checked_at: "2026-08-05T01:00:00.000Z",
              reported_at: "2026-08-05T01:00:00.000Z",
              received_at: "2026-08-05T01:00:00.000Z",
            },
            {
              id: "check-b",
              method: "qr",
              day_id: "day-b",
              profile_id: PROFILE_ID,
              checked_at: "2026-08-06T01:20:00.000Z",
              reported_at: "2026-08-06T01:20:00.000Z",
              received_at: "2026-08-06T01:20:00.000Z",
            },
          ],
          excuseStatuses: [],
        },
      },
    ];

    const values = myAttendanceValues(
      loaded,
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
    );

    expect(values.get("2026-08")).toBe(50);
  });
});

function emptyPayrollMonth(
  overrides: Partial<PayrollMonth> = {},
): PayrollMonth {
  return {
    wageRates: [],
    adjustments: [],
    excuseStatus: [],
    holidays: [],
    ...overrides,
  };
}

describe("myPayrollValues — 근무표 자체가 없는 달은 Map에서 빠진다", () => {
  it("days가 빈 달은 키가 없다", () => {
    const loaded = [
      { month: "2026-09", days: [], payroll: emptyPayrollMonth() },
    ];

    const values = myPayrollValues(
      loaded,
      PROFILE_ID,
      "2026-09-30T00:00:00.000Z",
      [],
    );

    expect(values.has("2026-09")).toBe(false);
  });

  it("loaded가 undefined면 빈 Map이다", () => {
    expect(
      myPayrollValues(undefined, PROFILE_ID, "2026-09-30T00:00:00.000Z", [])
        .size,
    ).toBe(0);
  });
});

describe("myPayrollValues — payrollViewDays를 그대로 불러 날마다 amount를 더한다", () => {
  it("8시간 근무·시급 12,000원인 날 하나면 그달 합이 96,000원이다", () => {
    const day = scheduleDay({
      id: "day-pay-1",
      work_date: "2026-08-10",
      starts_at: "10:00:00",
      ends_at: "18:00:00",
      assignments: [assignment({ id: "a-pay-1" })],
      check_ins: [
        {
          id: "check-pay-1",
          profile_id: PROFILE_ID,
          checked_at: "2026-08-10T01:00:00.000Z",
          reported_at: "2026-08-10T01:00:00.000Z",
          received_at: "2026-08-10T01:00:00.000Z",
        },
      ],
    });

    const loaded = [
      {
        month: "2026-08",
        days: [day],
        payroll: emptyPayrollMonth({
          wageRates: [
            {
              profile_id: PROFILE_ID,
              effective_date: "2026-08-01",
              amount: 12000,
              follows_default: false,
            },
          ],
        }),
      },
    ];

    const values = myPayrollValues(
      loaded,
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
      [],
    );

    expect(values.get("2026-08")).toBe(96000);
  });

  it("근무표는 있어도 내 급여로 잡을 날이 없으면 0으로 남는다(키는 있다)", () => {
    const loaded = [
      {
        month: "2026-08",
        days: [
          scheduleDay({
            assignments: [assignment({ profile_id: "다른-사람" })],
          }),
        ],
        payroll: emptyPayrollMonth(),
      },
    ];

    const values = myPayrollValues(
      loaded,
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
      [],
    );

    expect(values.has("2026-08")).toBe(true);
    expect(values.get("2026-08")).toBe(0);
  });
});

function rehearsal(overrides: Partial<Rehearsal> = {}): Rehearsal {
  return {
    id: "rehearsal-1",
    profile_id: PROFILE_ID,
    work_date: "2026-08-20",
    starts_at: "14:00",
    ends_at: "16:00",
    count: null,
    ...overrides,
  };
}

describe("myPayrollValues — 리허설이 붙은 날은 그 몫만큼 그달 합이 늘어난다(PAY-028)", () => {
  it("배정 없이 리허설만 있는 날도 payrollViewDays가 낸 금액만큼 더해진다", () => {
    const loaded = [
      {
        month: "2026-08",
        days: [],
        payroll: emptyPayrollMonth(),
      },
    ];

    const withoutRehearsal = myPayrollValues(
      loaded,
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
      [],
    );

    expect(withoutRehearsal.has("2026-08")).toBe(false);

    const withRehearsal = myPayrollValues(
      loaded,
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
      [rehearsal()],
    );

    expect(withRehearsal.get("2026-08")).toBe(0);
  });

  it("배정이 있는 날에 리허설이 겹치면 배정 급여 위에 리허설 몫이 얹힌다", () => {
    const day = scheduleDay({
      id: "day-pay-rehearsal",
      work_date: "2026-08-10",
      starts_at: "10:00:00",
      ends_at: "18:00:00",
      assignments: [assignment({ id: "a-pay-rehearsal" })],
      check_ins: [
        {
          id: "check-pay-rehearsal",
          profile_id: PROFILE_ID,
          checked_at: "2026-08-10T01:00:00.000Z",
          reported_at: "2026-08-10T01:00:00.000Z",
          received_at: "2026-08-10T01:00:00.000Z",
        },
      ],
    });

    const loaded = [
      {
        month: "2026-08",
        days: [day],
        payroll: emptyPayrollMonth({
          wageRates: [
            {
              profile_id: PROFILE_ID,
              effective_date: "2026-08-01",
              amount: 12000,
              follows_default: false,
            },
          ],
        }),
      },
    ];

    const withoutRehearsal = myPayrollValues(
      loaded,
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
      [],
    );
    const withRehearsal = myPayrollValues(
      loaded,
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
      [rehearsal({ work_date: "2026-08-10" })],
    );

    expect(withoutRehearsal.get("2026-08")).toBe(96000);
    expect(withRehearsal.get("2026-08")).toBeGreaterThan(96000);
  });
});

describe("joinPayrollByMonth — work.data와 payroll.data를 달로 묶어 PayrollMonthWithDays[]를 만든다", () => {
  it("근무표와 급여 재료가 둘 다 있는 달은 days와 payroll이 한 행으로 묶인다", () => {
    const day = scheduleDay({ work_date: "2026-08-10" });
    const work: WorkMonth[] = [{ month: "2026-08", days: [day] }];
    const payroll: { month: string; payroll: PayrollMonth }[] = [
      { month: "2026-08", payroll: emptyPayrollMonth() },
    ];

    const joined = joinPayrollByMonth(work, payroll);

    expect(joined).toEqual([
      { month: "2026-08", days: [day], payroll: emptyPayrollMonth() },
    ]);
  });

  it("급여 재료는 있는데 근무표가 없는 달은 days가 빈 배열로 선다", () => {
    const work: WorkMonth[] = [];
    const payroll: { month: string; payroll: PayrollMonth }[] = [
      { month: "2026-09", payroll: emptyPayrollMonth() },
    ];

    const joined = joinPayrollByMonth(work, payroll);

    expect(joined).toEqual([
      { month: "2026-09", days: [], payroll: emptyPayrollMonth() },
    ]);
  });

  it("근무표는 열렸는데 급여 재료가 아직 없는 달은 결과에서 빠진다(rates가 도는 축이다)", () => {
    const day = scheduleDay({ work_date: "2026-08-10" });
    const work: WorkMonth[] = [{ month: "2026-08", days: [day] }];
    const payroll: { month: string; payroll: PayrollMonth }[] = [];

    const joined = joinPayrollByMonth(work, payroll);

    expect(joined).toEqual([]);
  });

  it("work나 payroll 중 하나라도 아직 안 왔으면(undefined) undefined다", () => {
    expect(joinPayrollByMonth(undefined, [])).toBeUndefined();
    expect(joinPayrollByMonth([], undefined)).toBeUndefined();
  });
});

describe("myPayrollDaysOfMonth — 다른 달 리허설이 그 달 결과에 안 낀다", () => {
  it("리허설 목록에 다음 달 날짜가 섞여 있어도 그 달 날로 걸러져 안 든다", () => {
    const day = scheduleDay({
      id: "day-aug",
      work_date: "2026-08-10",
      starts_at: "10:00:00",
      ends_at: "18:00:00",
      assignments: [assignment({ id: "a-aug" })],
      check_ins: [
        {
          id: "check-aug",
          profile_id: PROFILE_ID,
          checked_at: "2026-08-10T01:00:00.000Z",
          reported_at: "2026-08-10T01:00:00.000Z",
          received_at: "2026-08-10T01:00:00.000Z",
        },
      ],
    });

    const loaded = [
      {
        month: "2026-08",
        days: [day],
        payroll: emptyPayrollMonth({
          wageRates: [
            {
              profile_id: PROFILE_ID,
              effective_date: "2026-08-01",
              amount: 12000,
              follows_default: false,
            },
          ],
        }),
      },
    ];

    const days = myPayrollDaysOfMonth(
      loaded,
      "2026-08",
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
      [
        rehearsal({ id: "r-aug", work_date: "2026-08-20" }),
        rehearsal({ id: "r-sep", work_date: "2026-09-05" }),
      ],
    );

    expect(days.map((one) => one.date).sort()).toEqual([
      "2026-08-10",
      "2026-08-20",
    ]);
  });
});

describe("myPayrollDaysOfMonth — 그 달 행이 loaded에 없으면 빈 배열이다", () => {
  it("보는 달이 payrollLoaded에 없으면 빈 배열이다", () => {
    const loaded = [
      { month: "2026-08", days: [], payroll: emptyPayrollMonth() },
    ];

    const days = myPayrollDaysOfMonth(
      loaded,
      "2026-09",
      PROFILE_ID,
      "2026-09-30T00:00:00.000Z",
      [],
    );

    expect(days).toEqual([]);
  });

  it("loaded가 아직 안 왔으면(undefined) 빈 배열이다", () => {
    const days = myPayrollDaysOfMonth(
      undefined,
      "2026-08",
      PROFILE_ID,
      "2026-08-31T00:00:00.000Z",
      [],
    );

    expect(days).toEqual([]);
  });
});

describe("myPayrollDaysOfMonth — profileId가 아직 없으면(프로필 로딩 전) 빈 배열이다", () => {
  it("그 달 행이 있어도 profileId가 null이면 빈 배열이다", () => {
    const day = scheduleDay({
      work_date: "2026-08-10",
      assignments: [assignment()],
    });
    const loaded = [
      { month: "2026-08", days: [day], payroll: emptyPayrollMonth() },
    ];

    const days = myPayrollDaysOfMonth(
      loaded,
      "2026-08",
      null,
      "2026-08-31T00:00:00.000Z",
      [],
    );

    expect(days).toEqual([]);
  });
});
