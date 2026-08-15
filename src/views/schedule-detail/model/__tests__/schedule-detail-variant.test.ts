import { describe, expect, it } from "vitest";

import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";
import { deriveScheduleDetailVariant } from "@/views/schedule-detail/model/schedule-detail-variant";

describe("deriveScheduleDetailVariant", () => {
  it("CLOSED 상태는 closed 변형이다", () => {
    expect(deriveScheduleDetailVariant("CLOSED")).toBe("closed");
  });

  it("OPEN 상태는 open 변형이다(모집 중 안내)", () => {
    expect(deriveScheduleDetailVariant("OPEN")).toBe("open");
  });

  it.each(["PREPARING", "CONFIRMED", "CANCELLED"] as RecruitmentScheduleStatus[])(
    "%s 상태는 confirmed 변형이다",
    (status) => {
      expect(deriveScheduleDetailVariant(status)).toBe("confirmed");
    },
  );
});
