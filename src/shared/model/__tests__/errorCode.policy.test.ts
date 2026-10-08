import { DomainError, TransportError } from "@/shared/model/error.type";
import { errorCodeOf } from "@/shared/model/errorCode.policy";

describe("errorCodeOf — 업무가 거절한 것만 코드를 준다", () => {
  it("업무가 거절하면 그 코드다", () => {
    expect(errorCodeOf(new DomainError("already_decided"))).toBe(
      "already_decided",
    );
  });

  it("통신이 끊긴 것은 코드가 없다", () => {
    expect(errorCodeOf(new TransportError("끊겼다", null))).toBeNull();
  });

  it("그냥 오류도 코드가 없다", () => {
    expect(errorCodeOf(new Error("끊겼다"))).toBeNull();
  });

  it("오류가 없으면 코드도 없다", () => {
    expect(errorCodeOf(null)).toBeNull();
  });
});
