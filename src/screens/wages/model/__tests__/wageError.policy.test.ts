import { DomainError } from "@/shared/model/error.type";
import { isNoDefaultWage } from "@/screens/wages/model/wageError.policy";

// 구현 대상: src/screens/wages/model/wageError.policy.ts
//
// 되돌리기가 `no_default_wage`로 거절당했는지다. `.tsx`가 `error instanceof DomainError`를
// 직접 묻고 코드를 꺼내 비교하고 있었다 — 화면 파일 여섯에 열다섯 건 있던 꼴 가운데 하나다.

describe("isNoDefaultWage — 되돌리기가 기본 시급이 없어 거절당했나", () => {
  it("그 코드면 참이다", () => {
    expect(isNoDefaultWage(new DomainError("no_default_wage"))).toBe(true);
  });

  it("다른 코드면 거짓이다", () => {
    expect(isNoDefaultWage(new DomainError("not_allowed"))).toBe(false);
  });

  it("도메인 오류가 아니면 거짓이다 — 통신이 끊긴 것은 다른 말을 해야 한다", () => {
    expect(isNoDefaultWage(new Error("끊겼다"))).toBe(false);
  });

  it("오류가 없으면 거짓이다", () => {
    expect(isNoDefaultWage(null)).toBe(false);
  });
});
