import { describe, expect, it } from "vitest";

import { assignmentIneligibleReasonLabel } from "@/entities/assignment/model/ineligible-reason";

describe("assignmentIneligibleReasonLabel", () => {
  it("GENDER_MISMATCH는 성별 조건 문구를 반환한다", () => {
    expect(assignmentIneligibleReasonLabel("GENDER_MISMATCH")).toBe(
      "포지션 성별 조건과 맞지 않아요",
    );
  });

  it("NOT_ELIGIBLE은 가능 포지션 문구를 반환한다", () => {
    expect(assignmentIneligibleReasonLabel("NOT_ELIGIBLE")).toBe(
      "이 포지션의 가능 포지션으로 등록되지 않았어요",
    );
  });
});
