"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { type ComponentPropsWithRef, useId } from "react";

import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap typo-label transition-colors disabled:cursor-not-allowed disabled:bg-disabled-surface disabled:text-disabled",
  {
    variants: {
      variant: {
        primary: "h-14 rounded-lg bg-action px-6 text-on-action",
        secondary: "h-12 rounded-md bg-neutral-surface px-5 text-text-strong",
        tertiary: "min-h-11 bg-transparent px-2 text-action",
        destructive: "h-12 rounded-md bg-danger px-5 text-on-action",
        icon: "size-11 rounded-pill bg-neutral-surface text-text-strong",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ComponentPropsWithRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    disabledReason?: string;
  };

export function Button({
  className,
  variant,
  asChild,
  loading,
  disabled,
  disabledReason,
  children,
  ref,
  ...props
}: ButtonProps) {
  const reasonId = useId();
  const Component = asChild ? Slot : "button";
  const isDisabled = disabled ?? loading;

  return (
    <>
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant }), className)}
        disabled={isDisabled}
        aria-busy={loading ? true : undefined}
        aria-describedby={disabledReason ? reasonId : undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Component>
      {disabledReason ? (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      ) : null}
    </>
  );
}
