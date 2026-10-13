import { type MemberWageRate } from "@/entities/payroll/model/payroll.type";
import {
  buildWageRows,
  type WageRowMember,
  latestWageRate,
  wageRatesOf,
} from "@/entities/payroll/model/wageRows.policy";

const MEMBERS: WageRowMember[] = [
  { profileId: "profile-1", displayName: "김도윤" },
  { profileId: "profile-2", displayName: "박서연" },
  { profileId: "profile-3", displayName: "이하늘" },
];

describe("buildWageRows — 이미 이름순인 입력의 순서를 안 흩는다", () => {
  it("개별로 정한 사람이 중간에 있어도 이름순 그대로 나온다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-1",
        effectiveDate: "2026-01-01",
        amount: 11000,
        followsDefault: true,
      },
      {
        profileId: "profile-2",
        effectiveDate: "2026-02-01",
        amount: 15000,
        followsDefault: false,
      },
      {
        profileId: "profile-3",
        effectiveDate: "2026-01-01",
        amount: 11000,
        followsDefault: true,
      },
    ];

    const rows = buildWageRows(MEMBERS, wageRates);

    expect(rows.map((row) => row.profileId)).toEqual([
      "profile-1",
      "profile-2",
      "profile-3",
    ]);
  });
});

describe("buildWageRows — 시급 이력이 빈 사람은 금액 자리가 null이다", () => {
  it("wage_rates 행이 하나도 없는 사람의 amount는 null이다", () => {
    const rows = buildWageRows(MEMBERS, []);
    const row = rows.find((one) => one.profileId === "profile-2");

    expect(row?.amount).toBeNull();
  });
});

describe("buildWageRows — 가장 최근 wage_rates 행의 금액을 쓴다", () => {
  it("이력이 여러 줄이면 effectiveDate가 가장 늦은 행의 금액을 쓴다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-2",
        effectiveDate: "2026-03-01",
        amount: 13000,
        followsDefault: false,
      },
      {
        profileId: "profile-2",
        effectiveDate: "2026-01-01",
        amount: 11000,
        followsDefault: true,
      },
    ];

    const rows = buildWageRows(MEMBERS, wageRates);
    const row = rows.find((one) => one.profileId === "profile-2");

    expect(row?.amount).toBe(13000);
  });
});

const RATES: MemberWageRate[] = [
  {
    profileId: "profile-1",
    effectiveDate: "2026-01-01",
    amount: 11000,
    followsDefault: true,
  },
  {
    profileId: "profile-1",
    effectiveDate: "2026-03-01",
    amount: 13000,
    followsDefault: false,
  },
  {
    profileId: "profile-2",
    effectiveDate: "2026-02-01",
    amount: 15000,
    followsDefault: false,
  },
];

describe("latestWageRate — 적용일이 가장 늦은 시급을 고른다", () => {
  it("입력 순서와 무관하게 적용일이 가장 늦은 행이다", () => {
    expect(latestWageRate([RATES[1], RATES[0]])?.amount).toBe(13000);
  });

  it("빈 목록이면 null이다", () => {
    expect(latestWageRate([])).toBeNull();
  });
});

describe("wageRatesOf — 한 사람의 시급 행만 거른다", () => {
  it("그 사람의 행만 순서대로 돌려준다", () => {
    expect(wageRatesOf(RATES, "profile-1")).toEqual([RATES[0], RATES[1]]);
  });

  it("행이 없는 사람이면 빈 목록이다", () => {
    expect(wageRatesOf(RATES, "profile-9")).toEqual([]);
  });
});
