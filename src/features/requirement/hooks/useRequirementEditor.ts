import { useMemo, useState, useTransition } from "react";

import type { Position } from "@/entities/position/model/position";
import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";
import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type RequirementMutationOutcome = { ok: true } | { ok: false; code: ErrorCode };

export type SetRequirementActionInput = {
  scheduleId: string;
  positionId: string;
  requiredCount: number;
};
export type RemoveRequirementActionInput = { scheduleId: string; positionId: string };

export type SetRequirementAction = (
  input: SetRequirementActionInput,
) => Promise<RequirementMutationOutcome>;
export type RemoveRequirementAction = (
  input: RemoveRequirementActionInput,
) => Promise<RequirementMutationOutcome>;

export type RequirementEditorInitial = {
  scheduleId: string;
  rows: ScheduleRequirementRow[];
  activePositions: Position[];
};

export function useRequirementEditor(
  initial: RequirementEditorInitial,
  onSet: SetRequirementAction,
  onRemove: RemoveRequirementAction,
) {
  const [rows, setRows] = useState(initial.rows);
  const [pending, startTransition] = useTransition();

  const missing = useMemo(
    () =>
      initial.activePositions.filter(
        (position) => !rows.some((row) => row.positionId === position.id),
      ),
    [rows, initial.activePositions],
  );

  function updateCount(positionId: string, value: number) {
    setRows((previous) =>
      previous.map((row) =>
        row.positionId === positionId ? { ...row, requiredCount: value } : row,
      ),
    );
  }

  function saveCount(positionId: string) {
    const row = rows.find((item) => item.positionId === positionId);
    if (row === undefined) {
      return;
    }

    startTransition(async () => {
      const result = await onSet({
        scheduleId: initial.scheduleId,
        positionId,
        requiredCount: row.requiredCount,
      });
      if (!result.ok) {
        showSnackbar(ERROR_CODES[result.code].message);
      }
    });
  }

  function removeRow(positionId: string) {
    startTransition(async () => {
      const result = await onRemove({ scheduleId: initial.scheduleId, positionId });
      if (!result.ok) {
        showSnackbar(ERROR_CODES[result.code].message);
        return;
      }
      setRows((previous) => previous.filter((row) => row.positionId !== positionId));
    });
  }

  function addMissing(positionId: string) {
    const position = initial.activePositions.find((item) => item.id === positionId);
    if (position === undefined) {
      return;
    }

    startTransition(async () => {
      const result = await onSet({
        scheduleId: initial.scheduleId,
        positionId,
        requiredCount: position.defaultRequiredCount,
      });
      if (!result.ok) {
        showSnackbar(ERROR_CODES[result.code].message);
        return;
      }
      setRows((previous) => [
        ...previous,
        {
          positionId,
          positionName: position.name,
          requiredCount: position.defaultRequiredCount,
        },
      ]);
    });
  }

  return { rows, missing, pending, updateCount, saveCount, removeRow, addMissing };
}
