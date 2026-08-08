"use client";

import type { Position } from "@/entities/position/model/position";
import { Button } from "@/shared/ui/button";

type MissingPositionsBannerProps = {
  missing: Position[];
  onAdd: (positionId: string) => void;
  pending: boolean;
};

export function MissingPositionsBanner({ missing, onAdd, pending }: MissingPositionsBannerProps) {
  if (missing.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="표에 없는 포지션"
      className="flex flex-col gap-2 rounded-md border border-warning-border bg-warning-surface p-4"
    >
      <p className="typo-body text-warning">표에 없는 포지션 {missing.length}개</p>
      <ul className="flex flex-col gap-2">
        {missing.map((position) => (
          <li key={position.id} className="flex items-center justify-between gap-2">
            <span className="typo-body text-text-strong">{position.name}</span>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => onAdd(position.id)}
            >
              추가
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
