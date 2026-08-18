import { cn } from "@/shared/lib/cn";

type SkeletonBarProps = {
  className?: string;
};

export function SkeletonBar({ className }: SkeletonBarProps) {
  return <div className={cn("rounded-xs bg-border", className)} />;
}
