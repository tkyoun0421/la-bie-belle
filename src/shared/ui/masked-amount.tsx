"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/cn";
import { maskDigits } from "@/shared/lib/mask-digits";

type MaskedAmountProps = {
  value: number;
  masked: boolean;
  sweep: boolean;
  format: (value: number) => string;
  onToggle: () => void;
  onSweepEnd: () => void;
  className?: string;
};

export function MaskedAmount({
  value,
  masked,
  sweep,
  format,
  onToggle,
  onSweepEnd,
  className,
}: MaskedAmountProps) {
  const formatted = format(value);
  const sweepRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = sweepRef.current;
    if (!el) return;

    const handleAnimationEnd = () => onSweepEnd();
    el.addEventListener("animationend", handleAnimationEnd);
    return () => el.removeEventListener("animationend", handleAnimationEnd);
  }, [onSweepEnd]);

  if (masked) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="금액 보기"
        className={cn("tabular-nums", className)}
      >
        <span aria-hidden="true" className="blur-[7px]">
          {maskDigits(formatted)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="금액 가리기"
      className={cn(
        "tabular-nums transition-transform duration-[var(--duration-feedback)] ease-[var(--ease-out)] active:scale-[0.96]",
        className,
      )}
    >
      <span ref={sweepRef} className={cn("inline-block", sweep && "amount-sweep")}>
        {formatted}
      </span>
    </button>
  );
}
