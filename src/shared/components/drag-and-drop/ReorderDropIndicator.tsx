import { cn } from "#/shared/lib/utils";

type ReorderDropIndicatorProps = {
  position: "top" | "bottom";
};

export function ReorderDropIndicator({
  position,
}: Readonly<ReorderDropIndicatorProps>) {
  if (position === "top") {
    return (
      <div className="pointer-events-none absolute inset-x-4 top-0">
        <div className="h-0.5 bg-[var(--primary)]" />
        <span className="mt-1 inline-flex rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
          여기에 놓기
        </span>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-0">
      <span className="mb-1 inline-flex rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
        여기에 놓기
      </span>
      <div className={cn("h-0.5 bg-[var(--primary)]")} />
    </div>
  );
}
