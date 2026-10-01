// 구현 대상: src/screens/approvals/model/rejectReason.ts
//
// 거절 이유 고르기의 유효성이다(approvals.md 「거절 짜임」). 아무것도 안 고르면
// 「거절 보내기」가 비활성이고, 「직접 쓰기」를 고르면 1~100자만 유효하다 — 근무자가
// 쓰는 취소 사유와 같은 상한이다.

import { isRejectReasonValid } from "@/screens/approvals/model/rejectReason";

describe("isRejectReasonValid — 이유를 아무것도 안 고르면 무효다", () => {
  it("null이면 무효다", () => {
    expect(isRejectReasonValid(null, "")).toBe(false);
  });
});

describe("isRejectReasonValid — 미리 놓은 문장을 고르면 글 없이도 유효하다", () => {
  it("no_replacement를 고르면 customText가 비어도 유효하다", () => {
    expect(isRejectReasonValid("no_replacement", "")).toBe(true);
  });
});

describe("isRejectReasonValid — 직접 쓰기는 빈 값이 무효다", () => {
  it("custom을 고르고 아무것도 안 쓰면 무효다", () => {
    expect(isRejectReasonValid("custom", "")).toBe(false);
  });
});

describe("isRejectReasonValid — 직접 쓰기는 101자부터 무효다", () => {
  it("100자는 유효하다", () => {
    expect(isRejectReasonValid("custom", "가".repeat(100))).toBe(true);
  });

  it("101자는 무효다", () => {
    expect(isRejectReasonValid("custom", "가".repeat(101))).toBe(false);
  });
});
