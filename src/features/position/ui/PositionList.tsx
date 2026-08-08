"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { isSystemPosition, type Position } from "@/entities/position/model/position";
import { Badge } from "@/shared/ui/badge";

type PositionListProps = {
  positions: Position[];
  onSelect: (position: Position) => void;
};

export function PositionList({ positions, onSelect }: PositionListProps) {
  const [showInactive, setShowInactive] = useState(false);
  const active = positions.filter((position) => position.isActive);
  const inactive = positions.filter((position) => !position.isActive);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col">
        {active.map((position) => (
          <li key={position.id}>
            <button
              type="button"
              onClick={() => onSelect(position)}
              className="flex w-full items-center justify-between gap-3 border-b border-border py-4 typo-body text-text-strong"
            >
              <span className="flex items-center gap-2">
                {position.name}
                {isSystemPosition(position) ? <Badge tone="neutral">시스템</Badge> : null}
              </span>
              <ChevronRight aria-hidden className="size-5 text-text" />
            </button>
          </li>
        ))}
      </ul>
      {inactive.length > 0 ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showInactive}
            onClick={() => setShowInactive((value) => !value)}
            className="typo-label text-text"
          >
            비활성 포지션 {inactive.length}개 {showInactive ? "접기" : "펼치기"}
          </button>
          {showInactive ? (
            <ul className="flex flex-col">
              {inactive.map((position) => (
                <li key={position.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(position)}
                    className="flex w-full items-center justify-between gap-3 border-b border-border py-4 typo-body text-disabled"
                  >
                    {position.name}
                    <ChevronRight aria-hidden className="size-5 text-disabled" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
