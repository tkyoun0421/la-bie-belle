import { memberRowsEmptyReason } from "@/entities/member/model/memberRowsEmpty.policy";

describe("memberRowsEmptyReason — 목록이 비었을 때 까닭", () => {
  it("재직 쪽에 회원이 아무도 없으면 noMembers다", () => {
    expect(
      memberRowsEmptyReason({ kind: "active", memberCount: 0, foundCount: 0 }),
    ).toBe("noMembers");
  });

  it("회원은 있는데 찾은 것이 없으면 noMatch다", () => {
    expect(
      memberRowsEmptyReason({ kind: "active", memberCount: 5, foundCount: 0 }),
    ).toBe("noMatch");
  });

  it("찾은 것이 있으면 noRows다", () => {
    expect(
      memberRowsEmptyReason({ kind: "active", memberCount: 5, foundCount: 2 }),
    ).toBe("noRows");
  });

  it("퇴사 쪽은 회원이 없어도 noRows다", () => {
    expect(
      memberRowsEmptyReason({ kind: "left", memberCount: 0, foundCount: 0 }),
    ).toBe("noRows");
  });

  it("퇴사 쪽은 찾은 것이 없어도 noRows다", () => {
    expect(
      memberRowsEmptyReason({ kind: "left", memberCount: 5, foundCount: 0 }),
    ).toBe("noRows");
  });
});
