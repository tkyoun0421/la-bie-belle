import {
  isRejectReasonValid,
  rejectReasonText,
} from "@/features/workRequest/model/rejectReason.policy";

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

describe("rejectReasonText — 근무자에게 갈 거절 문장을 만든다", () => {
  it("미리 놓은 문장을 고르면 그 문장이다", () => {
    expect(rejectReasonText("no_replacement", "")).toBe(
      "그날 대신 나올 사람이 없어요",
    );
  });

  it("직접 쓰기를 고르면 앞뒤 공백을 뗀 글이다", () => {
    expect(rejectReasonText("custom", "  다른 날로 부탁해요  ")).toBe(
      "다른 날로 부탁해요",
    );
  });

  it("아무것도 안 골랐으면 빈 글자다", () => {
    expect(rejectReasonText(null, "무시되는 글")).toBe("");
  });
});
