import { DomainError, TransportError } from "@/shared/model/error.type";
import { errorCodeOf } from "@/shared/model/errorCode.policy";

// 화면이 「업무가 거절한 것인가」를 묻는 자리가 저장소에 열 곳이고 전부 `instanceof`를 손으로
// 쓰고 있었다. 묻는 말은 하나다 — 이 오류에 업무 코드가 실렸나.

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
