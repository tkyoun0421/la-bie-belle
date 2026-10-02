// 구현 대상: src/screens/members/model/writeError.policy.ts
//
// 쓰기 넷이 돌려준 오류를 「서버가 이유를 말해 준 것」과 「그 밖」으로 가른다. `.tsx`가
// `instanceof DomainError`와 `Set.has`로 그 판정을 하고 있었다.

import { DomainError } from "@/shared/model/error.type";
import { isUnexpectedWriteError } from "@/screens/members/model/writeError.policy";

describe("isUnexpectedWriteError — 다룬 코드 셋이 아니면 「보내지 못했어요」다", () => {
  it("다루는 코드는 예상한 것이다", () => {
    expect(
      isUnexpectedWriteError(new DomainError("has_future_assignments")),
    ).toBe(false);
    expect(isUnexpectedWriteError(new DomainError("last_admin"))).toBe(false);
    expect(isUnexpectedWriteError(new DomainError("already_decided"))).toBe(
      false,
    );
  });

  it("다른 화면이 다루는 코드는 이 화면에서 예상 밖이다", () => {
    expect(isUnexpectedWriteError(new DomainError("not_allowed"))).toBe(true);
  });

  it("통신이 끊긴 것도 예상 밖이다", () => {
    expect(isUnexpectedWriteError(new Error("끊겼다"))).toBe(true);
  });

  it("오류가 없으면 예상 밖이 아니다", () => {
    expect(isUnexpectedWriteError(null)).toBe(false);
  });
});
