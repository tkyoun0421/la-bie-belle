import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";

export type UnderstaffedWarning = {
  positionId: string;
  positionName: string;
  requiredCount: number;
  assignedCount: number;
};

export type NoManagerWarning = {
  positionId: string;
  positionName: string;
  traineeCount: number;
};

export type ConfirmationWarnings = {
  understaffed: UnderstaffedWarning[];
  noManager: NoManagerWarning[];
};

export type ComputeConfirmationWarningsInput = {
  requirementRows: ScheduleRequirementRow[];
  assignedCounts: Record<string, number>;
  traineeCounts: Record<string, number>;
};

export function computeConfirmationWarnings(
  input: ComputeConfirmationWarningsInput,
): ConfirmationWarnings {
  const understaffed: UnderstaffedWarning[] = [];
  const noManager: NoManagerWarning[] = [];

  for (const row of input.requirementRows) {
    const assignedCount = input.assignedCounts[row.positionId] ?? 0;
    const traineeCount = input.traineeCounts[row.positionId] ?? 0;

    if (row.requiredCount > assignedCount) {
      understaffed.push({
        positionId: row.positionId,
        positionName: row.positionName,
        requiredCount: row.requiredCount,
        assignedCount,
      });
    }

    if (assignedCount === 0 && traineeCount >= 1) {
      noManager.push({
        positionId: row.positionId,
        positionName: row.positionName,
        traineeCount,
      });
    }
  }

  return { understaffed, noManager };
}
