import { describe, expect, it } from "vitest";

import { computeConfirmationWarnings } from "@/views/admin-schedule/model/confirmation-warnings";

describe("computeConfirmationWarnings", () => {
  it("happy path: 미달·담당자 없음·정상 포지션이 섞이면 각각 알맞은 목록에 담긴다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [
        { positionId: "manager", positionName: "매니저", requiredCount: 2 },
        { positionId: "song", positionName: "축가", requiredCount: 1 },
        { positionId: "scan", positionName: "스캔", requiredCount: 1 },
      ],
      assignedCounts: { manager: 1, scan: 1 },
      traineeCounts: { song: 1 },
    });

    expect(result).toEqual({
      understaffed: [
        { positionId: "manager", positionName: "매니저", requiredCount: 2, assignedCount: 1 },
        { positionId: "song", positionName: "축가", requiredCount: 1, assignedCount: 0 },
      ],
      noManager: [{ positionId: "song", positionName: "축가", traineeCount: 1 }],
    });
  });

  it("경계값: 필요 0·정식 0·교육생 1은 미달이 아니라 담당자 없음으로만 기록된다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [{ positionId: "scan", positionName: "스캔", requiredCount: 0 }],
      assignedCounts: {},
      traineeCounts: { scan: 1 },
    });

    expect(result).toEqual({
      understaffed: [],
      noManager: [{ positionId: "scan", positionName: "스캔", traineeCount: 1 }],
    });
  });

  it("경계값: 필요 인원을 전부 충족하면 두 목록 모두 비어 있다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [{ positionId: "manager", positionName: "매니저", requiredCount: 2 }],
      assignedCounts: { manager: 2 },
      traineeCounts: {},
    });

    expect(result).toEqual({ understaffed: [], noManager: [] });
  });

  it("경계값: 필요·정식·교육 전부 0이면 두 목록 모두 비어 있다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [{ positionId: "manager", positionName: "매니저", requiredCount: 0 }],
      assignedCounts: {},
      traineeCounts: {},
    });

    expect(result).toEqual({ understaffed: [], noManager: [] });
  });

  it("주요 실패: 교육생 수는 미달 판정에 섞이지 않는다(정식 배정 수만 본다)", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [{ positionId: "manager", positionName: "매니저", requiredCount: 1 }],
      assignedCounts: {},
      traineeCounts: { manager: 5 },
    });

    expect(result.understaffed).toEqual([
      { positionId: "manager", positionName: "매니저", requiredCount: 1, assignedCount: 0 },
    ]);
  });

  it("포지션 배열이 비어 있으면 두 목록 모두 비어 있다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [],
      assignedCounts: {},
      traineeCounts: {},
    });

    expect(result).toEqual({ understaffed: [], noManager: [] });
  });
});
