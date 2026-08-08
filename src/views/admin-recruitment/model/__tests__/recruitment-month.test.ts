import { afterEach, describe, expect, it, vi } from "vitest";

import { parseRecruitmentMonthParam } from "@/views/admin-recruitment/model/recruitment-month";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseRecruitmentMonthParam", () => {
  it("month 파라미터가 가리키는 달의 1일을 반환한다", () => {
    const month = parseRecruitmentMonthParam("2026-09", "2026-08-15");

    expect(month.getFullYear()).toBe(2026);
    expect(month.getMonth()).toBe(8);
    expect(month.getDate()).toBe(1);
  });

  it("KST보다 서쪽 시간대에서도 month 파라미터가 가리키는 달을 그대로 반환한다(F-03 회귀)", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");

    const month = parseRecruitmentMonthParam("2026-09", "2026-08-15");

    expect(month.getFullYear()).toBe(2026);
    expect(month.getMonth()).toBe(8);
    expect(month.getDate()).toBe(1);
  });

  it("파라미터가 없으면 오늘(KST) 기준 달의 1일로 대체한다", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");

    const month = parseRecruitmentMonthParam(undefined, "2026-08-15");

    expect(month.getFullYear()).toBe(2026);
    expect(month.getMonth()).toBe(7);
    expect(month.getDate()).toBe(1);
  });

  it("형식이 올바르지 않은 파라미터는 오늘 기준 달로 대체한다", () => {
    const month = parseRecruitmentMonthParam("2026/09", "2026-08-15");

    expect(month.getMonth()).toBe(7);
  });
});
