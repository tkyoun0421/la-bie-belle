import { DomainError } from "@/shared/model/error.type";
import { isNoDefaultWage } from "@/features/wageAdmin/model/wageError.policy";

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
