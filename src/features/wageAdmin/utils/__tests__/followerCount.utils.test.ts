import type { MemberWageRate } from "@/entities/payroll/model/payroll.type";
import { WAGE_SHEET_COPY } from "@/features/wageAdmin/consts/wageAdmin.const";
import {
  countFollowers,
  spellBaseWageNote,
  spellFollowerChangeLine,
} from "@/features/wageAdmin/utils/followerCount.utils";

const PROFILE_IDS = ["profile-1", "profile-2", "profile-3"];

describe("countFollowers — 가장 최근 행이 followsDefault=true인 사람을 센다", () => {
  it("이력이 있고 최근 행이 기본을 따르면 포함한다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-1",
        effectiveDate: "2026-01-01",
        amount: 11000,
        followsDefault: true,
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

describe("countFollowers — 가장 최근 행이 followsDefault=false인 사람은 뺀다", () => {
  it("개별로 정한 사람은 카운트에서 빠진다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-2",
        effectiveDate: "2026-01-01",
        amount: 15000,
        followsDefault: false,
      },
    ];

    expect(countFollowers(PROFILE_IDS, wageRates)).toBe(2);
  });
});

describe("countFollowers — 이력이 여러 줄이면 가장 최근 값만 본다", () => {
  it("배열 순서와 무관하게 effectiveDate가 가장 늦은 행으로 판정한다", () => {
    const wageRates: MemberWageRate[] = [
      {
        profileId: "profile-1",
        effectiveDate: "2026-03-01",
        amount: 12000,
        followsDefault: true,
      },
      {
        profileId: "profile-1",
        effectiveDate: "2026-01-01",
        amount: 11000,
        followsDefault: false,
      },
      {
        profileId: "profile-2",
        effectiveDate: "2026-01-01",
        amount: 11000,
        followsDefault: true,
      },
      {
        profileId: "profile-2",
        effectiveDate: "2026-03-01",
        amount: 15000,
        followsDefault: false,
      },
    ];

    expect(countFollowers(PROFILE_IDS, wageRates)).toBe(2);
  });
});

describe("spellBaseWageNote — 기본이 섰는지로 시제가 갈린다", () => {
  it("기본이 서 있고 쓰는 사람이 있으면 지금 몇인지를 말한다", () => {
    expect(
      spellBaseWageNote({ hasDefaultWage: true, followerCount: 3 }),
    ).toContain("3");
  });

  it("기본이 서 있고 쓰는 사람이 없으면 수를 안 적는다", () => {
    expect(spellBaseWageNote({ hasDefaultWage: true, followerCount: 0 })).toBe(
      WAGE_SHEET_COPY.noFollower,
    );
  });

  it("기본이 없으면 정하면 몇에게 붙을지를 말한다", () => {
    expect(
      spellBaseWageNote({ hasDefaultWage: false, followerCount: 2 }),
    ).toContain("2");
  });

  it("기본도 없고 따를 사람도 없으면 수를 안 적는다", () => {
    expect(spellBaseWageNote({ hasDefaultWage: false, followerCount: 0 })).toBe(
      WAGE_SHEET_COPY.willFollowNone,
    );
  });
});

describe("spellFollowerChangeLine — 저장하면 몇이 같이 바뀌는지", () => {
  it("따르는 사람이 있으면 그 수를 적는다", () => {
    expect(spellFollowerChangeLine(4)).toContain("4");
  });

  it("없으면 기본 시급 줄과 같은 글자를 쓴다", () => {
    expect(spellFollowerChangeLine(0)).toBe(WAGE_SHEET_COPY.noFollower);
  });
});
