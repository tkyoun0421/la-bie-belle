import { describe, expect, it } from "vitest";

import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";
import { deriveScheduleDetailVariant } from "@/views/schedule-detail/model/schedule-detail-variant";

describe("deriveScheduleDetailVariant", () => {
  it("CLOSED 상태는 closed 변형이다", () => {
    expect(deriveScheduleDetailVariant("CLOSED")).toBe("closed");
  });

  it.each(["OPEN", "PREPARING", "CONFIRMED", "CANCELLED"] as RecruitmentScheduleStatus[])(
    "%s 상태는 confirmed 변형(기존 스텁)이다",
    (status) => {
      expect(deriveScheduleDetailVariant(status)).toBe("confirmed");
    },
  );
});
