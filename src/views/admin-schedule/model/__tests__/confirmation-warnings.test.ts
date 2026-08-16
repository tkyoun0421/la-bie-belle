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
      traineePositions: [],
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
      traineePositions: [],
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
      traineePositions: [],
    });

    expect(result).toEqual({ understaffed: [], noManager: [] });
  });

  it("경계값: 필요·정식·교육 전부 0이면 두 목록 모두 비어 있다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [{ positionId: "manager", positionName: "매니저", requiredCount: 0 }],
      assignedCounts: {},
      traineeCounts: {},
      traineePositions: [],
    });

    expect(result).toEqual({ understaffed: [], noManager: [] });
  });

  it("주요 실패: 교육생 수는 미달 판정에 섞이지 않는다(정식 배정 수만 본다)", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [{ positionId: "manager", positionName: "매니저", requiredCount: 1 }],
      assignedCounts: {},
      traineeCounts: { manager: 5 },
      traineePositions: [],
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
      traineePositions: [],
    });

    expect(result).toEqual({ understaffed: [], noManager: [] });
  });

  it("P3-T11: 필요 인원 표 밖 포지션에 교육생만 남으면 담당자 없음에 sortOrder·이름순으로 덧붙는다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [{ positionId: "manager", positionName: "매니저", requiredCount: 1 }],
      assignedCounts: { manager: 1 },
      traineeCounts: { scan: 2, dress: 1 },
      traineePositions: [
        { positionId: "dress", positionName: "드레스", sortOrder: 40 },
        { positionId: "scan", positionName: "스캔", sortOrder: 20 },
      ],
    });

    expect(result).toEqual({
      understaffed: [],
      noManager: [
        { positionId: "scan", positionName: "스캔", traineeCount: 2 },
        { positionId: "dress", positionName: "드레스", traineeCount: 1 },
      ],
    });
  });

  it("P3-T11 경계값: 표 밖 포지션에 정식 배정만 남으면 어떤 경고도 만들지 않는다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [],
      assignedCounts: { main: 1 },
      traineeCounts: {},
      traineePositions: [],
    });

    expect(result).toEqual({ understaffed: [], noManager: [] });
  });

  it("P3-T11 경계값: 표 밖 포지션에 정식 배정과 교육생이 함께 있으면 정식 배정이 있으므로 담당자 없음을 만들지 않는다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [],
      assignedCounts: { main: 1 },
      traineeCounts: { main: 1 },
      traineePositions: [{ positionId: "main", positionName: "메인", sortOrder: 30 }],
    });

    expect(result).toEqual({ understaffed: [], noManager: [] });
  });

  it("P3-T11: 표 안 포지션과 표 밖 포지션이 함께 있으면 표 안 순서 뒤에 표 밖 항목이 붙는다", () => {
    const result = computeConfirmationWarnings({
      requirementRows: [{ positionId: "song", positionName: "축가", requiredCount: 1 }],
      assignedCounts: {},
      traineeCounts: { song: 1, scan: 1 },
      traineePositions: [{ positionId: "scan", positionName: "스캔", sortOrder: 20 }],
    });

    expect(result).toEqual({
      understaffed: [
        { positionId: "song", positionName: "축가", requiredCount: 1, assignedCount: 0 },
      ],
      noManager: [
        { positionId: "song", positionName: "축가", traineeCount: 1 },
        { positionId: "scan", positionName: "스캔", traineeCount: 1 },
      ],
    });
  });
});
