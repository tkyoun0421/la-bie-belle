import type { Position } from "@/entities/position/model/position";
import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";
import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";

export type RequirementSectionDataInput = {
  requirementsOk: boolean;
  requirementRows: ScheduleRequirementRow[];
  assignedCounts: Record<string, number>;
  assignedWorkerCount: number;
  positionsOk: boolean;
  positions: Position[];
};

export type RequirementSectionData =
  | {
      ok: true;
      requirementRows: ScheduleRequirementRow[];
      assignedCounts: Record<string, number>;
      assignedWorkerCount: number;
      activePositions: Position[];
    }
  | { ok: false };

export function resolveRequirementSectionData(
  input: RequirementSectionDataInput,
): RequirementSectionData {
  if (!input.requirementsOk || !input.positionsOk) {
    return { ok: false };
  }

  return {
    ok: true,
    requirementRows: input.requirementRows,
    assignedCounts: input.assignedCounts,
    assignedWorkerCount: input.assignedWorkerCount,
    activePositions: input.positions.filter((position) => position.isActive),
  };
}

export type AssignedHeadcount = { workerCount: number; positionTotal: number };

export function resolveAssignedHeadcount(input: {
  assignedCounts: Record<string, number>;
  assignedWorkerCount: number;
}): AssignedHeadcount | null {
  const positionTotal = Object.values(input.assignedCounts).reduce((sum, count) => sum + count, 0);

  if (positionTotal === input.assignedWorkerCount) {
    return null;
  }

  return { workerCount: input.assignedWorkerCount, positionTotal };
}

const NON_COPYABLE_REQUIREMENT_STATUSES: RecruitmentScheduleStatus[] = ["CONFIRMED", "CANCELLED"];

export type ShouldCopyScheduleRequirementsInput = {
  status: RecruitmentScheduleStatus;
  existingRequirementRowCount: number;
};

export function shouldCopyScheduleRequirements(
  input: ShouldCopyScheduleRequirementsInput,
): boolean {
  return (
    input.existingRequirementRowCount === 0 &&
    !NON_COPYABLE_REQUIREMENT_STATUSES.includes(input.status)
  );
}
