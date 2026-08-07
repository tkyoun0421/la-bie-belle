"use client";

import type { WorkerPosition } from "@/entities/identity/types/worker";
import type { PositionActionOutcome } from "@/features/worker-management/hooks/usePositionAction";
import { PositionToggleButton } from "@/features/worker-management/ui/PositionToggleButton";
import { Badge } from "@/shared/ui/badge";

type PositionToggleListProps = {
  positions: WorkerPosition[];
  onGrant: (positionId: string) => Promise<PositionActionOutcome>;
  onRevoke: (positionId: string) => Promise<PositionActionOutcome>;
};

export function PositionToggleList({ positions, onGrant, onRevoke }: PositionToggleListProps) {
  return (
    <ul className="flex flex-col">
      {positions.map((position) => (
        <li
          key={position.id}
          className="flex items-center justify-between gap-3 border-b border-border py-4"
        >
          <span className="typo-body text-text-strong">{position.name}</span>
          {position.isDefault ? (
            <Badge tone="neutral">기본 적용</Badge>
          ) : (
            <PositionToggleButton
              granted={position.granted}
              onGrant={onGrant.bind(null, position.id)}
              onRevoke={onRevoke.bind(null, position.id)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
