import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

const dBadgeVariants = cva(
  "inline-flex size-8 items-center justify-center rounded-cell typo-caption-strong font-semibold tabular-nums",
  {
    variants: {
      tier: {
        d1: "bg-action-tint-strong text-action-deep",
        d2: "bg-action-tint text-action-deep",
        neutral: "bg-surface-weak text-text",
      },
    },
  },
);

type DBadgeProps = {
  label: string;
  tier: "d1" | "d2" | "neutral";
  className?: string;
};

export function DBadge({ label, tier, className }: DBadgeProps) {
  return <span className={cn(dBadgeVariants({ tier }), className)}>{label}</span>;
}
