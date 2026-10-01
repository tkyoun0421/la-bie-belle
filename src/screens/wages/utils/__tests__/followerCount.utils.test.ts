import {
  countFollowers,
  type WageRateRow,
} from "@/screens/wages/utils/followerCount.utils";

const PROFILE_IDS = ["profile-1", "profile-2", "profile-3"];

describe("countFollowers — 가장 최근 행이 follows_default=true인 사람을 센다", () => {
  it("이력이 있고 최근 행이 기본을 따르면 포함한다", () => {
    const wageRates: WageRateRow[] = [
      {
        profile_id: "profile-1",
        effective_date: "2026-01-01",
        amount: 11000,
        follows_default: true,
      },
    ];

    expect(countFollowers(PROFILE_IDS, wageRates)).toBe(3);
  });
});

describe("countFollowers — wage_rates 행이 아예 없는 승인 사원도 포함한다(PAY-012)", () => {
  it("이력이 하나도 없으면 승인 사원 전원을 센다", () => {
    expect(countFollowers(PROFILE_IDS, [])).toBe(3);
  });
});

describe("countFollowers — 가장 최근 행이 follows_default=false인 사람은 뺀다", () => {
  it("개별로 정한 사람은 카운트에서 빠진다", () => {
    const wageRates: WageRateRow[] = [
      {
        profile_id: "profile-2",
        effective_date: "2026-01-01",
        amount: 15000,
        follows_default: false,
      },
    ];

    expect(countFollowers(PROFILE_IDS, wageRates)).toBe(2);
  });
});

describe("countFollowers — 이력이 여러 줄이면 가장 최근 값만 본다", () => {
  it("배열 순서와 무관하게 effective_date가 가장 늦은 행으로 판정한다", () => {
    const wageRates: WageRateRow[] = [
      {
        profile_id: "profile-1",
        effective_date: "2026-03-01",
        amount: 12000,
        follows_default: true,
      },
      {
        profile_id: "profile-1",
        effective_date: "2026-01-01",
        amount: 11000,
        follows_default: false,
      },
      {
        profile_id: "profile-2",
        effective_date: "2026-01-01",
        amount: 11000,
        follows_default: true,
      },
      {
        profile_id: "profile-2",
        effective_date: "2026-03-01",
        amount: 15000,
        follows_default: false,
      },
    ];

    expect(countFollowers(PROFILE_IDS, wageRates)).toBe(2);
  });
});
