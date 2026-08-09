import type { Position } from "@/entities/position/model/position";
import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";

export type RequirementSectionDataInput = {
  requirementsOk: boolean;
  requirementRows: ScheduleRequirementRow[];
  positionsOk: boolean;
  positions: Position[];
};

export type RequirementSectionData =
  | { ok: true; requirementRows: ScheduleRequirementRow[]; activePositions: Position[] }
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
    activePositions: input.positions.filter((position) => position.isActive),
  };
}
