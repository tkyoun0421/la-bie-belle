import { isExcuseDecision } from "@/entities/attendance/model/excuseDecision.policy";

describe("isExcuseDecision — 사유 결정 글자만 참이다", () => {
  it("승인과 반려 글자는 참이다", () => {
    expect(isExcuseDecision("approved")).toBe(true);
    expect(isExcuseDecision("rejected")).toBe(true);
  });

  it("모르는 글자는 거짓이다", () => {
    expect(isExcuseDecision("pending")).toBe(false);
    expect(isExcuseDecision("")).toBe(false);
  });

  it("글자가 아닌 값은 거짓이다", () => {
    expect(isExcuseDecision(null)).toBe(false);
    expect(isExcuseDecision(undefined)).toBe(false);
    expect(isExcuseDecision(1)).toBe(false);
  });
});
