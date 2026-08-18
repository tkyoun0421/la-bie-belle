"use client";

import { cn } from "@/shared/lib/cn";

const MASK_PLACEHOLDER = "○,○○○,○○○원";

type MaskedAmountProps = {
  value: number;
  masked: boolean;
  sweep: boolean;
  format: (value: number) => string;
  onReveal: () => void;
  className?: string;
};

export function MaskedAmount({
  value,
  masked,
  sweep,
  format,
  onReveal,
  className,
}: MaskedAmountProps) {
  if (masked) {
    return (
      <button
        type="button"
        onClick={onReveal}
        aria-label="금액 보기"
        className={cn("tabular-nums", className)}
      >
        <span aria-hidden="true" className="blur-[7px]">
          {MASK_PLACEHOLDER}
        </span>
      </button>
    );
  }

  return (
    <span className={cn("tabular-nums", sweep && "amount-sweep", className)}>{format(value)}</span>
  );
}
