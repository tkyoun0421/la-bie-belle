"use client";

import { Check } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { BottomSheet } from "@/shared/ui/bottom-sheet";

type SelectFieldOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  value: string | null;
  options: readonly SelectFieldOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const valueId = useId();
  const describedById = useId();
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="typo-label text-text">
        {label}
      </span>
      <button
        type="button"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? describedById : undefined}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-13 items-center justify-between rounded-md border border-border bg-surface-weak px-4 typo-body text-text-strong",
          error && "border-danger-border",
        )}
      >
        <span id={valueId}>{selected ? selected.label : (placeholder ?? "")}</span>
      </button>
      {error ? (
        <p id={describedById} className="typo-caption text-danger">
          {error}
        </p>
      ) : null}
      <BottomSheet open={open} onOpenChange={setOpen} title={label}>
        <ul role="listbox" aria-label={label} className="flex flex-col">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="flex min-h-13 w-full items-center justify-between px-2 typo-body text-text-strong"
                >
                  {option.label}
                  {isSelected ? <Check aria-hidden className="size-4 text-action" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </div>
  );
}
