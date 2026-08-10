import { describe, expect, it } from "vitest";

import {
  resolveRequirementSectionData,
  shouldCopyScheduleRequirements,
} from "@/views/admin-schedule/model/requirement-section-data";

const ACTIVE_POSITION = {
  id: "position-1",
  name: "스캔",
  code: null,
  defaultRequiredCount: 1,
  genderRequirement: "any" as const,
  isDefault: false,
  isActive: true,
};

const INACTIVE_POSITION = {
  ...ACTIVE_POSITION,
  id: "position-2",
  name: "구형포지션",
  isActive: false,
};

const REQUIREMENT_ROW = { positionId: "position-1", positionName: "스캔", requiredCount: 2 };

describe("resolveRequirementSectionData", () => {
  it("F-03: 두 조회가 모두 성공하면 활성 포지션과 배정 수를 함께 반환한다", () => {
    const result = resolveRequirementSectionData({
      requirementsOk: true,
      requirementRows: [REQUIREMENT_ROW],
      assignedCounts: { "position-1": 3 },
      positionsOk: true,
      positions: [ACTIVE_POSITION, INACTIVE_POSITION],
    });

    expect(result).toEqual({
      ok: true,
      requirementRows: [REQUIREMENT_ROW],
      assignedCounts: { "position-1": 3 },
      activePositions: [ACTIVE_POSITION],
    });
  });

  it("F-03: 조회가 둘 다 성공하고 실제로 빈 상태면 진짜 빈 표로 ok:true를 반환한다(실패와 구분)", () => {
    const result = resolveRequirementSectionData({
      requirementsOk: true,
      requirementRows: [],
      assignedCounts: {},
      positionsOk: true,
      positions: [],
    });

    expect(result).toEqual({
      ok: true,
      requirementRows: [],
      assignedCounts: {},
      activePositions: [],
    });
  });

  it("F-03: requirements 조회가 실패하면 positions가 성공해도 ok:false다(빈 표로 위장하지 않는다)", () => {
    const result = resolveRequirementSectionData({
      requirementsOk: false,
      requirementRows: [],
      assignedCounts: {},
      positionsOk: true,
      positions: [ACTIVE_POSITION],
    });

    expect(result).toEqual({ ok: false });
  });

  it("F-03: positions 조회가 실패하면 requirements가 성공해도 ok:false다", () => {
    const result = resolveRequirementSectionData({
      requirementsOk: true,
      requirementRows: [REQUIREMENT_ROW],
      assignedCounts: { "position-1": 1 },
      positionsOk: false,
      positions: [],
    });

    expect(result).toEqual({ ok: false });
  });
});

describe("shouldCopyScheduleRequirements", () => {
  it("CI-REGRESSION: 표 행이 없고 상태가 복사 가능하면 복사가 필요하다고 판단한다", () => {
    expect(shouldCopyScheduleRequirements({ status: "OPEN", existingRequirementRowCount: 0 })).toBe(
      true,
    );
  });

  it("CI-REGRESSION: 표 행이 이미 있으면 상태와 무관하게 복사하지 않는다(매 렌더 RPC 재호출 회귀 방지)", () => {
    expect(shouldCopyScheduleRequirements({ status: "OPEN", existingRequirementRowCount: 1 })).toBe(
      false,
    );
  });

  it("CI-REGRESSION: CONFIRMED 상태면 표가 비어 있어도 복사하지 않는다", () => {
    expect(
      shouldCopyScheduleRequirements({ status: "CONFIRMED", existingRequirementRowCount: 0 }),
    ).toBe(false);
  });

  it("CI-REGRESSION: CANCELLED 상태면 표가 비어 있어도 복사하지 않는다", () => {
    expect(
      shouldCopyScheduleRequirements({ status: "CANCELLED", existingRequirementRowCount: 0 }),
    ).toBe(false);
  });
});
