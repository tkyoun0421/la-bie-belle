import { type ComponentPropsWithoutRef, useId } from "react";

import { cn } from "@/shared/lib/cn";

type InputProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
  error?: string;
  helperText?: string;
  disabledReason?: string;
};

export function Input({
  label,
  error,
  helperText,
  disabledReason,
  disabled,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedById = useId();
  const description = error ?? disabledReason ?? helperText;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="typo-label text-text">
        {label}
      </label>
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={description ? describedById : undefined}
        className={cn(
          "h-13 rounded-md border border-border bg-surface-weak px-4 typo-body text-text-strong",
          "disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled",
          error && "border-danger-border",
          className,
        )}
        {...props}
      />
      {description ? (
        <p id={describedById} className={cn("typo-caption", error ? "text-danger" : "text-text")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
