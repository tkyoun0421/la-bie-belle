import type { TraineePosition } from "@/entities/schedule/api/list-schedule-requirements";
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
  traineePositions: TraineePosition[];
};

export function computeConfirmationWarnings(
  input: ComputeConfirmationWarningsInput,
): ConfirmationWarnings {
  const understaffed: UnderstaffedWarning[] = [];
  const noManager: NoManagerWarning[] = [];
  const tablePositionIds = new Set(input.requirementRows.map((row) => row.positionId));

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

  const offTablePositions = input.traineePositions
    .filter((position) => !tablePositionIds.has(position.positionId))
    .filter((position) => (input.assignedCounts[position.positionId] ?? 0) === 0)
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.positionName.localeCompare(b.positionName, "ko"),
    );

  for (const position of offTablePositions) {
    noManager.push({
      positionId: position.positionId,
      positionName: position.positionName,
      traineeCount: input.traineeCounts[position.positionId] ?? 0,
    });
  }

  return { understaffed, noManager };
}
