import { describe, expect, it } from "vitest";

import {
  CopyRequirementsInputSchema,
  RemoveRequirementInputSchema,
  SetRequirementInputSchema,
  mapRequirementRpcErrorCode,
} from "@/entities/schedule/model/requirement-manage";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

describe("CopyRequirementsInputSchema", () => {
  it("scheduleId가 uuid가 아니면 거부한다", () => {
    expect(CopyRequirementsInputSchema.safeParse({ scheduleId: "not-a-uuid" }).success).toBe(false);
  });

  it("유효한 scheduleId는 통과한다", () => {
    const parsed = CopyRequirementsInputSchema.safeParse({
      scheduleId: "11111111-1111-4111-8111-111111111111",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("SetRequirementInputSchema", () => {
  const base = {
    scheduleId: "11111111-1111-4111-8111-111111111111",
    positionId: "22222222-2222-4222-8222-222222222222",
  };

  it("필요 인원 0은 허용한다", () => {
    expect(SetRequirementInputSchema.safeParse({ ...base, requiredCount: 0 }).success).toBe(true);
  });

  it("음수 필요 인원은 거부한다", () => {
    expect(SetRequirementInputSchema.safeParse({ ...base, requiredCount: -1 }).success).toBe(false);
  });

  it("정수가 아닌 필요 인원은 거부한다", () => {
    expect(SetRequirementInputSchema.safeParse({ ...base, requiredCount: 1.5 }).success).toBe(
      false,
    );
  });
});

describe("RemoveRequirementInputSchema", () => {
  it("scheduleId·positionId가 모두 uuid여야 통과한다", () => {
    const parsed = RemoveRequirementInputSchema.safeParse({
      scheduleId: "11111111-1111-4111-8111-111111111111",
      positionId: "22222222-2222-4222-8222-222222222222",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("mapRequirementRpcErrorCode", () => {
  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", () => {
    expect(mapRequirementRpcErrorCode("42501")).toBe(ERROR_CODE.IDENTITY_NOT_ACTIVE);
  });

  it("LB020은 SCHEDULING_STATUS_CONFLICT로 매핑한다", () => {
    expect(mapRequirementRpcErrorCode("LB020")).toBe(ERROR_CODE.SCHEDULING_STATUS_CONFLICT);
  });

  it("22023은 SCHEDULING_VALIDATION으로 매핑한다", () => {
    expect(mapRequirementRpcErrorCode("22023")).toBe(ERROR_CODE.SCHEDULING_VALIDATION);
  });

  it("LB034는 SCHEDULING_REVISION_LAST_REQUIREMENT로 매핑한다", () => {
    expect(mapRequirementRpcErrorCode("LB034")).toBe(
      ERROR_CODE.SCHEDULING_REVISION_LAST_REQUIREMENT,
    );
  });

  it("그 외 코드는 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapRequirementRpcErrorCode("57P01")).toBe(ERROR_CODE.COMMON_UNEXPECTED);
    expect(mapRequirementRpcErrorCode(undefined)).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });
});
