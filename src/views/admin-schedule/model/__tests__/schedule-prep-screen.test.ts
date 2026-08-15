import { describe, expect, it } from "vitest";

import {
  resolveSchedulePrepScreenMode,
  schedulePrepStatusLabel,
} from "@/views/admin-schedule/model/schedule-prep-screen";

describe("resolveSchedulePrepScreenMode", () => {
  it("취소 상태는 예식 유무와 무관하게 항상 readonly다(P3-T09)", () => {
    expect(resolveSchedulePrepScreenMode({ status: "CANCELLED", ceremonyTimes: [] })).toBe(
      "readonly",
    );
    expect(resolveSchedulePrepScreenMode({ status: "CANCELLED", ceremonyTimes: ["10:00"] })).toBe(
      "readonly",
    );
  });

  it("확정 상태는 더는 readonly가 아니고 예식이 있으면 editing이다(P3-T09, 확정 후 편집 개방)", () => {
    expect(resolveSchedulePrepScreenMode({ status: "CONFIRMED", ceremonyTimes: ["10:00"] })).toBe(
      "editing",
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
