import { LoaderCircle } from "lucide-react";
import { cn } from "#/shared/lib/utils";

type InlineSpinnerProps = {
  className?: string;
};

export function InlineSpinner({
  className,
}: Readonly<InlineSpinnerProps>) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn("size-4 animate-spin", className)}
    />
  );
}
