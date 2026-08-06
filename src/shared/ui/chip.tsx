import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type ChipProps = {
  children: ReactNode;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Chip({ children, selected, onSelectedChange, disabled, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelectedChange(!selected)}
      className={cn(
        "inline-flex min-h-11 items-center rounded-pill border px-3 typo-label transition-colors",
        `duration-[var(--duration-feedback)]`,
        selected
          ? "border-action-border bg-action-surface text-action"
          : "border-border bg-surface text-text",
        disabled && "cursor-not-allowed border-disabled-border bg-disabled-surface text-disabled",
        className,
      )}
    >
      {children}
    </button>
  );
}
