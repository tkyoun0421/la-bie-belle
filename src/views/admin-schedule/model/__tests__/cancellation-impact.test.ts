import { describe, expect, it } from "vitest";

import { computeCancellationImpact } from "@/views/admin-schedule/model/cancellation-impact";

describe("computeCancellationImpact", () => {
  it("정식 배정 인원과 교육생 인원을 합산한다", () => {
    const result = computeCancellationImpact({
      assignedWorkerCount: 3,
      traineeCounts: { "position-a": 2, "position-b": 1 },
    });

    expect(result).toBe(6);
  });

  it("교육생이 없으면 정식 배정 인원만 반환한다", () => {
    const result = computeCancellationImpact({
      assignedWorkerCount: 5,
      traineeCounts: {},
    });

    expect(result).toBe(5);
  });

  it("0명 스케줄은 0을 반환한다", () => {
    const result = computeCancellationImpact({
      assignedWorkerCount: 0,
      traineeCounts: {},
    });

    expect(result).toBe(0);
  });

  it("겸직 여부와 무관하게 assignedWorkerCount는 사람 수 그대로 쓴다(중복 집계하지 않는다)", () => {
    const result = computeCancellationImpact({
      assignedWorkerCount: 1,
      traineeCounts: { "position-a": 0, "position-b": 0 },
    });

    expect(result).toBe(1);
  });
});
