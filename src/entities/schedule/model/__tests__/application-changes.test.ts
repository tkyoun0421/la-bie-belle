import { describe, expect, it } from "vitest";

import {
  APPLICATION_CHANGES_MAX,
  ApplicationChangesInputSchema,
  mapApplicationRpcErrorCode,
} from "@/entities/schedule/model/application-changes";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

const SCHEDULE_ID_A = "11111111-1111-4111-8111-111111111111";
const SCHEDULE_ID_B = "22222222-2222-4222-8222-222222222222";

describe("ApplicationChangesInputSchema", () => {
  it("신청·철회 uuid 배열을 통과시킨다", () => {
    const parsed = ApplicationChangesInputSchema.safeParse({
      applyScheduleIds: [SCHEDULE_ID_A],
      withdrawScheduleIds: [SCHEDULE_ID_B],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.applyScheduleIds).toEqual([SCHEDULE_ID_A]);
      expect(parsed.data.withdrawScheduleIds).toEqual([SCHEDULE_ID_B]);
    }
  });

  it("각 배열의 중복 id를 정리해 distinct만 남긴다", () => {
    const parsed = ApplicationChangesInputSchema.safeParse({
      applyScheduleIds: [SCHEDULE_ID_A, SCHEDULE_ID_A],
      withdrawScheduleIds: [],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.applyScheduleIds).toEqual([SCHEDULE_ID_A]);
    }
  });

  it("두 배열이 모두 비어 있으면 거부한다", () => {
    const parsed = ApplicationChangesInputSchema.safeParse({
      applyScheduleIds: [],
      withdrawScheduleIds: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("같은 id가 신청·철회에 동시에 있으면 거부한다", () => {
    const parsed = ApplicationChangesInputSchema.safeParse({
      applyScheduleIds: [SCHEDULE_ID_A],
      withdrawScheduleIds: [SCHEDULE_ID_A],
    });

    expect(parsed.success).toBe(false);
  });

  it("uuid 형식이 아닌 값은 거부한다", () => {
    const parsed = ApplicationChangesInputSchema.safeParse({
      applyScheduleIds: ["not-a-uuid"],
      withdrawScheduleIds: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("합산 개수가 상한(366)과 정확히 같으면 통과시킨다", () => {
    const applyScheduleIds = Array.from(
      { length: APPLICATION_CHANGES_MAX },
      (_, index) => `33333333-3333-4333-8333-${String(index).padStart(12, "0")}`,
    );

    const parsed = ApplicationChangesInputSchema.safeParse({
      applyScheduleIds,
      withdrawScheduleIds: [],
    });

    expect(parsed.success).toBe(true);
  });

  it("합산 개수가 상한(366)을 넘으면 거부한다", () => {
    const applyScheduleIds = Array.from(
      { length: APPLICATION_CHANGES_MAX + 1 },
      (_, index) => `33333333-3333-4333-8333-${String(index).padStart(12, "0")}`,
    );

    const parsed = ApplicationChangesInputSchema.safeParse({
      applyScheduleIds,
      withdrawScheduleIds: [],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("mapApplicationRpcErrorCode", () => {
  it("42501을 IDENTITY_NOT_ACTIVE로 매핑한다", () => {
    expect(mapApplicationRpcErrorCode("42501")).toBe(ERROR_CODE.IDENTITY_NOT_ACTIVE);
  });

  it("23505를 SCHEDULING_APPLICATION_BLOCKED로 매핑한다", () => {
    expect(mapApplicationRpcErrorCode("23505")).toBe(ERROR_CODE.SCHEDULING_APPLICATION_BLOCKED);
  });

  it("22023을 SCHEDULING_VALIDATION으로 매핑한다", () => {
    expect(mapApplicationRpcErrorCode("22023")).toBe(ERROR_CODE.SCHEDULING_VALIDATION);
  });

  it("그 외 코드는 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapApplicationRpcErrorCode("XX000")).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });

  it("코드가 없으면 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapApplicationRpcErrorCode(undefined)).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });
});
