// 구현 대상: src/screens/rehearsal/model/rehearsalGuard.policy.ts
//
// /me/rehearsals의 문이다(plan AC-08) — 자격이 있는 사람과 관리자만 연다. 다른 사람이
// 주소를 직접 치면 /me로 보낸다. 자격 조회가 끝나기 전에는 판정을 미룬다.

import { resolveRehearsalGuard } from "@/screens/rehearsal/model/rehearsalGuard.policy";

describe("resolveRehearsalGuard — 자격 조회가 끝나기 전에는 기다린다", () => {
  it("isLoading이면 hasGrant·isAdmin과 무관하게 wait다", () => {
    expect(
      resolveRehearsalGuard({
        isAdmin: false,
        hasGrant: false,
        isLoading: true,
      }),
    ).toBe("wait");

    expect(
      resolveRehearsalGuard({ isAdmin: true, hasGrant: true, isLoading: true }),
    ).toBe("wait");
  });
});

describe("resolveRehearsalGuard — 관리자는 자격이 없어도 연다", () => {
  it("isAdmin이 참이면 hasGrant가 거짓이어도 allow다", () => {
    expect(
      resolveRehearsalGuard({
        isAdmin: true,
        hasGrant: false,
        isLoading: false,
      }),
    ).toBe("allow");
  });
});

describe("resolveRehearsalGuard — 자격 있는 근무자는 연다", () => {
  it("isAdmin이 거짓이어도 hasGrant가 참이면 allow다", () => {
    expect(
      resolveRehearsalGuard({
        isAdmin: false,
        hasGrant: true,
        isLoading: false,
      }),
    ).toBe("allow");
  });
});

describe("resolveRehearsalGuard — 자격 없는 근무자는 /me로 돌려보낸다", () => {
  it("isAdmin도 hasGrant도 거짓이면 redirect-me다", () => {
    expect(
      resolveRehearsalGuard({
        isAdmin: false,
        hasGrant: false,
        isLoading: false,
      }),
    ).toBe("redirect-me");
  });
});
