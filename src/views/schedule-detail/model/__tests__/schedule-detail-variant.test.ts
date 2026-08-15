import { describe, expect, it } from "vitest";

import { deriveScheduleDetailVariant } from "@/views/schedule-detail/model/schedule-detail-variant";

describe("deriveScheduleDetailVariant", () => {
  it("CLOSED 상태는 closed 변형이다", () => {
    expect(deriveScheduleDetailVariant("CLOSED")).toBe("closed");
  });

  it("OPEN 상태는 open 변형이다(모집 중 안내)", () => {
    expect(deriveScheduleDetailVariant("OPEN")).toBe("open");
  });

  it("PREPARING 상태는 closed 변형이다(F-07, 확정 전 준비 중은 모집 마감과 같은 안내)", () => {
    expect(deriveScheduleDetailVariant("PREPARING")).toBe("closed");
  });

  it("CONFIRMED 상태는 confirmed 변형이다", () => {
    expect(deriveScheduleDetailVariant("CONFIRMED")).toBe("confirmed");
  });

  it("CANCELLED 상태는 cancelled 변형이다(P3-T09)", () => {
    expect(deriveScheduleDetailVariant("CANCELLED")).toBe("cancelled");
  });
});
