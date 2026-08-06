import { describe, expect, it } from "vitest";

import {
  APPLIED_SCHEDULE_APPLICATION,
  MIXED_MONTH_APPLICATIONS,
} from "@/entities/schedule/model/application.mock";

describe("application mock", () => {
  it("신청 시각을 ISO 일시로 갖는다", () => {
    expect(APPLIED_SCHEDULE_APPLICATION.appliedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("혼합 월 시나리오에 신청한 날짜가 포함된다", () => {
    expect(MIXED_MONTH_APPLICATIONS.map((application) => application.date)).toContain("2026-08-04");
  });
});
