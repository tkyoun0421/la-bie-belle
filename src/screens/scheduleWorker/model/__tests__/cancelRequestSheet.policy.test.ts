import {
  cancelRequestBadge,
  isValidCancelReason,
} from "@/screens/scheduleWorker/model/cancelRequestSheet.policy";

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

describe("cancelRequestBadge — 살아 있는 취소 요청이면 「취소 요청 중」이다", () => {
  it("살아 있으면 배지 문구를 낸다", () => {
    expect(cancelRequestBadge(true)).toBe("취소 요청 중");
  });

  it("없으면 null이다", () => {
    expect(cancelRequestBadge(false)).toBeNull();
  });
});
