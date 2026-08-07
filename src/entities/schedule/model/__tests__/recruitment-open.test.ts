import { describe, expect, it } from "vitest";

import {
  RECRUITMENT_OPEN_DATES_MAX,
  RecruitmentOpenInputSchema,
  mapRecruitmentRpcErrorCode,
} from "@/entities/schedule/model/recruitment-open";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

describe("RecruitmentOpenInputSchema", () => {
  it("유효한 yyyy-MM-dd 날짜 배열과 마감일을 통과시킨다", () => {
    const parsed = RecruitmentOpenInputSchema.safeParse({
      dates: ["2099-09-01", "2099-09-02"],
      applicationDeadline: "2099-09-01",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dates).toEqual(["2099-09-01", "2099-09-02"]);
    }
  });

  it("중복 날짜를 정리해 distinct만 남긴다", () => {
    const parsed = RecruitmentOpenInputSchema.safeParse({
      dates: ["2099-09-01", "2099-09-01", "2099-09-02"],
      applicationDeadline: "2099-09-01",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dates).toHaveLength(2);
    }
  });

  it("빈 배열은 거부한다", () => {
    const parsed = RecruitmentOpenInputSchema.safeParse({
      dates: [],
      applicationDeadline: "2099-09-01",
    });

    expect(parsed.success).toBe(false);
  });

  it("yyyy-MM-dd 형식이 아닌 날짜는 거부한다", () => {
    const parsed = RecruitmentOpenInputSchema.safeParse({
      dates: ["2099/09/01"],
      applicationDeadline: "2099-09-01",
    });

    expect(parsed.success).toBe(false);
  });

  it("존재하지 않는 달력 날짜는 거부한다", () => {
    const parsed = RecruitmentOpenInputSchema.safeParse({
      dates: ["2099-02-30"],
      applicationDeadline: "2099-02-01",
    });

    expect(parsed.success).toBe(false);
  });

  it("형식이 올바르지 않은 마감일은 거부한다", () => {
    const parsed = RecruitmentOpenInputSchema.safeParse({
      dates: ["2099-09-01"],
      applicationDeadline: "2099/09/01",
    });

    expect(parsed.success).toBe(false);
  });

  it("중복 제거 후에도 상한(366)을 넘으면 거부한다", () => {
    const dates = Array.from({ length: RECRUITMENT_OPEN_DATES_MAX + 1 }, (_, index) => {
      const date = new Date(Date.UTC(2100, 0, 1));
      date.setUTCDate(date.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });

    const parsed = RecruitmentOpenInputSchema.safeParse({
      dates,
      applicationDeadline: "2100-01-01",
    });

    expect(parsed.success).toBe(false);
  });

  it("상한(366)과 정확히 같은 개수는 통과시킨다", () => {
    const dates = Array.from({ length: RECRUITMENT_OPEN_DATES_MAX }, (_, index) => {
      const date = new Date(Date.UTC(2100, 0, 1));
      date.setUTCDate(date.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });

    const parsed = RecruitmentOpenInputSchema.safeParse({
      dates,
      applicationDeadline: "2100-01-01",
    });

    expect(parsed.success).toBe(true);
  });
});

describe("mapRecruitmentRpcErrorCode", () => {
  it("42501을 COMMON_FORBIDDEN으로 매핑한다", () => {
    expect(mapRecruitmentRpcErrorCode("42501")).toBe(ERROR_CODE.COMMON_FORBIDDEN);
  });

  it("23505를 SCHEDULING_DATE_CONFLICT로 매핑한다", () => {
    expect(mapRecruitmentRpcErrorCode("23505")).toBe(ERROR_CODE.SCHEDULING_DATE_CONFLICT);
  });

  it.each(["LB021", "23514", "22023"])("%s를 SCHEDULING_VALIDATION으로 매핑한다", (code) => {
    expect(mapRecruitmentRpcErrorCode(code)).toBe(ERROR_CODE.SCHEDULING_VALIDATION);
  });

  it("그 외 코드는 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapRecruitmentRpcErrorCode("XX000")).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });

  it("코드가 없으면 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapRecruitmentRpcErrorCode(undefined)).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });
});
