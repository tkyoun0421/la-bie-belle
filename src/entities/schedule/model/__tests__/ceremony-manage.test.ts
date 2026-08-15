import { describe, expect, it } from "vitest";

import {
  ReplaceCeremoniesInputSchema,
  SetPlannedTimesInputSchema,
  mapCeremonyRpcErrorCode,
} from "@/entities/schedule/model/ceremony-manage";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

const VALID_SCHEDULE_ID = "13000000-0000-4000-8000-000000000001";

describe("ReplaceCeremoniesInputSchema", () => {
  it("유효한 입력을 통과시킨다", () => {
    const result = ReplaceCeremoniesInputSchema.safeParse({
      scheduleId: VALID_SCHEDULE_ID,
      ceremonyTimes: ["10:00", "11:00"],
    });
    expect(result.success).toBe(true);
  });

  it("예식이 0개면 거부한다", () => {
    const result = ReplaceCeremoniesInputSchema.safeParse({
      scheduleId: VALID_SCHEDULE_ID,
      ceremonyTimes: [],
    });
    expect(result.success).toBe(false);
  });

  it("예식이 13개면 거부한다", () => {
    const times = Array.from({ length: 13 }, (_, index) => `0${index}:00`.slice(-5));
    const result = ReplaceCeremoniesInputSchema.safeParse({
      scheduleId: VALID_SCHEDULE_ID,
      ceremonyTimes: times,
    });
    expect(result.success).toBe(false);
  });

  it("시각 형식이 아니면 거부한다", () => {
    const result = ReplaceCeremoniesInputSchema.safeParse({
      scheduleId: VALID_SCHEDULE_ID,
      ceremonyTimes: ["25:00"],
    });
    expect(result.success).toBe(false);
  });

  it("scheduleId가 uuid가 아니면 거부한다", () => {
    const result = ReplaceCeremoniesInputSchema.safeParse({
      scheduleId: "not-a-uuid",
      ceremonyTimes: ["10:00"],
    });
    expect(result.success).toBe(false);
  });
});

describe("SetPlannedTimesInputSchema", () => {
  it("유효한 입력을 통과시킨다", () => {
    const result = SetPlannedTimesInputSchema.safeParse({
      scheduleId: VALID_SCHEDULE_ID,
      checkin: "08:20",
      checkout: "15:30",
    });
    expect(result.success).toBe(true);
  });

  it("시각 형식이 아니면 거부한다", () => {
    const result = SetPlannedTimesInputSchema.safeParse({
      scheduleId: VALID_SCHEDULE_ID,
      checkin: "8:20",
      checkout: "15:30",
    });
    expect(result.success).toBe(false);
  });
});

describe("mapCeremonyRpcErrorCode", () => {
  it("42501을 IDENTITY_NOT_ACTIVE로 매핑한다", () => {
    expect(mapCeremonyRpcErrorCode("42501")).toBe(ERROR_CODE.IDENTITY_NOT_ACTIVE);
  });

  it("LB020을 SCHEDULING_STATUS_CONFLICT로 매핑한다", () => {
    expect(mapCeremonyRpcErrorCode("LB020")).toBe(ERROR_CODE.SCHEDULING_STATUS_CONFLICT);
  });

  it("22023을 SCHEDULING_VALIDATION으로 매핑한다", () => {
    expect(mapCeremonyRpcErrorCode("22023")).toBe(ERROR_CODE.SCHEDULING_VALIDATION);
  });

  it("LB033을 SCHEDULING_REVISION_NO_CEREMONY로 매핑한다", () => {
    expect(mapCeremonyRpcErrorCode("LB033")).toBe(ERROR_CODE.SCHEDULING_REVISION_NO_CEREMONY);
  });

  it("그 외 코드는 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapCeremonyRpcErrorCode("XX000")).toBe(ERROR_CODE.COMMON_UNEXPECTED);
    expect(mapCeremonyRpcErrorCode(undefined)).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });
});
