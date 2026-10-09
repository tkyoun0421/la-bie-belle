import { type MemberWageRate } from "@/entities/payroll/model/payroll.type";
import {
  buildWageRows,
  type WageRowMember,
} from "@/screens/wages/model/wageRows.policy";

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
