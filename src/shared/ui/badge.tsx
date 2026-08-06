import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

const badgeVariants = cva("inline-flex items-center rounded-pill px-2.5 py-1 typo-caption", {
  variants: {
    tone: {
      neutral: "bg-neutral-surface text-neutral",
      action: "bg-action-surface text-action",
      success: "bg-success-surface text-success",
      warning: "bg-warning-surface text-warning",
      danger: "bg-danger-surface text-danger",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, tone, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}
