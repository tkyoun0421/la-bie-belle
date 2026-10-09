import { isValidCancelReason } from "@/features/workRequest/model/cancelReason.policy";

describe("isValidCancelReason — 1자 이상 100자 이하만 유효하다", () => {
  it("빈 문자열은 무효다", () => {
    expect(isValidCancelReason("")).toBe(false);
  });

  it("1자는 유효하다", () => {
    expect(isValidCancelReason("아")).toBe(true);
  });

  it("100자는 유효하다", () => {
    expect(isValidCancelReason("가".repeat(100))).toBe(true);
  });

  it("101자는 무효다", () => {
    expect(isValidCancelReason("가".repeat(101))).toBe(false);
  });
});
