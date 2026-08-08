import { describe, expect, it } from "vitest";

import {
  resolveSchedulePrepScreenMode,
  schedulePrepStatusLabel,
} from "@/views/admin-schedule/model/schedule-prep-screen";

describe("resolveSchedulePrepScreenMode", () => {
  it("확정·취소 상태는 항상 readonly다", () => {
    expect(resolveSchedulePrepScreenMode({ status: "CONFIRMED", ceremonyTimes: ["10:00"] })).toBe(
      "readonly",
    );
    expect(resolveSchedulePrepScreenMode({ status: "CANCELLED", ceremonyTimes: [] })).toBe(
      "readonly",
    );
  });

  it("확정 전이고 예식이 없으면 empty다", () => {
    expect(resolveSchedulePrepScreenMode({ status: "OPEN", ceremonyTimes: [] })).toBe("empty");
    expect(resolveSchedulePrepScreenMode({ status: "PREPARING", ceremonyTimes: [] })).toBe("empty");
  });

  it("확정 전이고 예식이 있으면 editing이다", () => {
    expect(
      resolveSchedulePrepScreenMode({ status: "OPEN", ceremonyTimes: ["10:00", "11:00"] }),
    ).toBe("editing");
    expect(resolveSchedulePrepScreenMode({ status: "CLOSED", ceremonyTimes: ["10:00"] })).toBe(
      "editing",
    );
  });
});

describe("schedulePrepStatusLabel", () => {
  it("각 상태를 한국어 라벨로 바꾼다", () => {
    expect(schedulePrepStatusLabel("OPEN")).toBe("모집 중");
    expect(schedulePrepStatusLabel("CLOSED")).toBe("모집 마감");
    expect(schedulePrepStatusLabel("PREPARING")).toBe("준비 중");
    expect(schedulePrepStatusLabel("CONFIRMED")).toBe("확정");
    expect(schedulePrepStatusLabel("CANCELLED")).toBe("취소");
  });
});
