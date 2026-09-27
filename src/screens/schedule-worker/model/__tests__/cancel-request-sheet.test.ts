// 구현 대상: src/screens/schedule-worker/model/cancel-request-sheet.ts
//
// 근무 취소 시트의 사유 유효성과 「보낸 뒤」 배지다(schedule-worker.md 「근무 취소
// 시트」·「보낸 뒤」). 사유는 1~100자(design.md AC-02의 `invalid_reason`과 같은 경계),
// 살아 있는 취소 요청이 있으면 Badge neutral 「취소 요청 중」이 선다 — 버튼 노출은
// `day-sheet.ts`의 `canShowShiftActions`가 맡는다.

import {
  cancelRequestBadge,
  isValidCancelReason,
} from "@/screens/schedule-worker/model/cancel-request-sheet";

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
