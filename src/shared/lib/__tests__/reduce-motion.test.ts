import { motionDistance } from "@/shared/lib/reduce-motion";

describe("motionDistance — 동작 줄이기 판정 (AC-06)", () => {
  it("켜짐이면 이동 거리가 0이다", async () => {
    const isReduceMotionEnabled = async () => true;

    await expect(motionDistance(24, isReduceMotionEnabled)).resolves.toBe(0);
  });

  it("꺼짐이면 문서가 정한 거리 그대로다", async () => {
    const isReduceMotionEnabled = async () => false;

    await expect(motionDistance(24, isReduceMotionEnabled)).resolves.toBe(24);
  });

  it("거리가 0이면 켜짐·꺼짐과 무관하게 0이다 — 경계", async () => {
    const isReduceMotionEnabled = async () => false;

    await expect(motionDistance(0, isReduceMotionEnabled)).resolves.toBe(0);
  });
});
