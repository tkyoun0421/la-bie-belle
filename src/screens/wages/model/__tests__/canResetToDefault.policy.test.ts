import type { MemberWageRate } from "@/entities/payroll/model/payroll.type";
import { canResetToDefault } from "@/screens/wages/model/canResetToDefault.policy";

describe("canResetToDefault — 개별로 정했고 기본 시급이 있으면 보인다", () => {
  it("최근 행이 followsDefault=false고 기본 시급이 있으면 true다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-1",
        effectiveDate: "2026-01-01",
        amount: 15000,
        followsDefault: false,
      },
    ];

    expect(canResetToDefault(wageRates, true)).toBe(true);
  });
});

describe("canResetToDefault — 기본을 따르면 숨긴다(이력이 빈 사람 포함)", () => {
  it("최근 행이 followsDefault=true면 false다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-1",
        effectiveDate: "2026-01-01",
        amount: 11000,
        followsDefault: true,
      },
    ];

    expect(canResetToDefault(wageRates, true)).toBe(false);
  });

  it("시급 이력이 아예 없어도 false다(PAY-012)", () => {
    expect(canResetToDefault([], true)).toBe(false);
  });
});

describe("canResetToDefault — 기본 시급 자체가 미정이면 개별로 정한 사람이어도 숨긴다", () => {
  it("최근 행이 followsDefault=false여도 기본 시급이 없으면 false다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-1",
        effectiveDate: "2026-01-01",
        amount: 15000,
        followsDefault: false,
      },
    ];

    expect(canResetToDefault(wageRates, false)).toBe(false);
  });
});

describe("canResetToDefault — 이력이 여러 줄이면 가장 최근 행만 본다", () => {
  it("예전엔 개별이었지만 최근 행이 기본을 따르면 false다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-1",
        effectiveDate: "2026-01-01",
        amount: 15000,
        followsDefault: false,
      },
      {
        profileId: "profile-1",
        effectiveDate: "2026-03-01",
        amount: 12000,
        followsDefault: true,
      },
    ];

    expect(canResetToDefault(wageRates, true)).toBe(false);
  });
});
