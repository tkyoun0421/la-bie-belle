import { describe, expect, it } from "vitest";

import {
  RecruitmentManageInputSchema,
  mapRecruitmentManageRpcErrorCode,
} from "@/entities/schedule/model/recruitment-manage";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

describe("RecruitmentManageInputSchema", () => {
  it("유효한 uuid와 yyyy-MM-dd 마감일을 통과시킨다", () => {
    const parsed = RecruitmentManageInputSchema.safeParse({
      scheduleId: "13000000-0000-4000-8000-000000000001",
      newDeadline: "2099-09-01",
    });

    expect(parsed.success).toBe(true);
  });

  it("uuid 형식이 아닌 scheduleId는 거부한다", () => {
    const parsed = RecruitmentManageInputSchema.safeParse({
      scheduleId: "not-a-uuid",
      newDeadline: "2099-09-01",
    });

    expect(parsed.success).toBe(false);
  });

  it("yyyy-MM-dd 형식이 아닌 마감일은 거부한다", () => {
    const parsed = RecruitmentManageInputSchema.safeParse({
      scheduleId: "13000000-0000-4000-8000-000000000001",
      newDeadline: "2099/09/01",
    });

    expect(parsed.success).toBe(false);
  });

  it("존재하지 않는 달력 날짜는 거부한다", () => {
    const parsed = RecruitmentManageInputSchema.safeParse({
      scheduleId: "13000000-0000-4000-8000-000000000001",
      newDeadline: "2099-02-30",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("mapRecruitmentManageRpcErrorCode", () => {
  it("42501을 COMMON_FORBIDDEN으로 매핑한다", () => {
    expect(mapRecruitmentManageRpcErrorCode("42501")).toBe(ERROR_CODE.COMMON_FORBIDDEN);
  });

  it.each(["22023", "LB020"])("%s를 SCHEDULING_STATUS_CONFLICT로 매핑한다", (code) => {
    expect(mapRecruitmentManageRpcErrorCode(code)).toBe(ERROR_CODE.SCHEDULING_STATUS_CONFLICT);
  });

  it.each(["LB021", "23514"])("%s를 SCHEDULING_VALIDATION으로 매핑한다", (code) => {
    expect(mapRecruitmentManageRpcErrorCode(code)).toBe(ERROR_CODE.SCHEDULING_VALIDATION);
  });

  it("그 외 코드는 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapRecruitmentManageRpcErrorCode("XX000")).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });

  it("코드가 없으면 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapRecruitmentManageRpcErrorCode(undefined)).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });
});
