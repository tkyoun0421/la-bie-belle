"use client";

import { cn } from "@/shared/lib/cn";

type SegmentedControlOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type SegmentedControlProps<TValue extends string> = {
  label: string;
  options: readonly SegmentedControlOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  className?: string;
};

export function SegmentedControl<TValue extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<TValue>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex gap-1 rounded-md bg-surface-strong p-1", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-sm px-3 py-1.5 typo-caption font-semibold",
              "transition-colors duration-[var(--duration-feedback)] ease-[var(--ease-out)]",
              selected ? "bg-surface text-text-strong" : "text-text-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
