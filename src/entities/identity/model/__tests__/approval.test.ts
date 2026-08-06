import { describe, expect, it } from "vitest";

import {
  mapApprovalRpcErrorCode,
  REJECT_REASON_MAX_LENGTH,
  RejectReasonSchema,
} from "@/entities/identity/model/approval";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

describe("RejectReasonSchema", () => {
  it("빈 문자열을 허용한다(사유 선택 입력)", () => {
    expect(RejectReasonSchema.safeParse("").success).toBe(true);
  });

  it("앞뒤 공백을 잘라낸다", () => {
    const result = RejectReasonSchema.safeParse("  서류 미비  ");

    expect(result.success && result.data).toBe("서류 미비");
  });

  it(`최대 길이(${REJECT_REASON_MAX_LENGTH}자) 이내는 허용한다`, () => {
    const reason = "가".repeat(REJECT_REASON_MAX_LENGTH);

    expect(RejectReasonSchema.safeParse(reason).success).toBe(true);
  });

  it(`최대 길이(${REJECT_REASON_MAX_LENGTH}자)를 넘으면 거부한다`, () => {
    const reason = "가".repeat(REJECT_REASON_MAX_LENGTH + 1);

    expect(RejectReasonSchema.safeParse(reason).success).toBe(false);
  });
});

describe("mapApprovalRpcErrorCode", () => {
  it("22023(상태 불일치)은 IDENTITY_ALREADY_PROCESSED로 매핑한다", () => {
    expect(mapApprovalRpcErrorCode("22023")).toBe(ERROR_CODE.IDENTITY_ALREADY_PROCESSED);
  });

  it("42501(권한 없음)은 COMMON_FORBIDDEN으로 매핑한다", () => {
    expect(mapApprovalRpcErrorCode("42501")).toBe(ERROR_CODE.COMMON_FORBIDDEN);
  });

  it("그 외 코드는 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapApprovalRpcErrorCode("57P01")).toBe(ERROR_CODE.COMMON_UNEXPECTED);
    expect(mapApprovalRpcErrorCode(undefined)).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });
});
