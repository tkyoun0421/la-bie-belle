"use client";

import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type RequirementTableProps = {
  rows: ScheduleRequirementRow[];
  onUpdateCount: (positionId: string, value: number) => void;
  onSaveCount: (positionId: string) => void;
  onRemoveRow: (positionId: string) => void;
  pending: boolean;
};

export function RequirementTable({
  rows,
  onUpdateCount,
  onSaveCount,
  onRemoveRow,
  pending,
}: RequirementTableProps) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.positionId} className="flex flex-wrap items-end gap-2">
          <Input
            label={row.positionName}
            type="number"
            inputMode="numeric"
            min={0}
            value={row.requiredCount}
            onChange={(event) => onUpdateCount(row.positionId, Number(event.target.value))}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => onSaveCount(row.positionId)}
          >
            인원 저장
          </Button>
          <Button
            type="button"
            variant="tertiary"
            disabled={pending}
            onClick={() => onRemoveRow(row.positionId)}
          >
            인원 삭제
          </Button>
        </li>
      ))}
    </ul>
  );
}
