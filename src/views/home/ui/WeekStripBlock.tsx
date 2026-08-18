import { cn } from "@/shared/lib/cn";
import { MaskedAmount } from "@/shared/ui/masked-amount";
import type { UseAmountRevealResult } from "@/shared/hooks/useAmountReveal";
import { formatWon } from "@/views/home/model/format-won";
import type { WeekFooter, WeekStripCell } from "@/views/home/model/week-strip";
import { FailedRow } from "@/views/home/ui/FailedRow";

type WeekStripBlockProps = {
  status: "filled" | "empty" | "failed";
  cells: readonly WeekStripCell[];
  today: string;
  footer: WeekFooter;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  reveal: UseAmountRevealResult;
};

export function WeekStripBlock({
  status,
  cells,
  today,
  footer,
  selectedDate,
  onSelect,
  reveal,
}: WeekStripBlockProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 pb-1.5 typo-caption-strong text-text-muted">이번 주</p>

      {status === "failed" ? (
        <div className="rounded-xl bg-surface px-4 py-1">
          <FailedRow message="이번 주를 불러오지 못했어요" />
        </div>
      ) : (
        <div className="flex flex-col gap-0 rounded-xl bg-surface px-4 py-3">
          <div className="flex gap-0.5">
            {cells.map((cell) => (
              <button
                key={cell.date}
                type="button"
                disabled={!cell.hasShift}
                onClick={() => onSelect(cell.date)}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="typo-caption text-text-muted">{cell.weekdayLabel}</span>
                <span
                  className={cn(
                    "flex size-8.5 items-center justify-center rounded-cell typo-body tabular-nums",
                    cell.hasShift ? "font-medium text-text-strong" : "text-text-weak",
                    cell.date === today ? "ring-1 ring-border ring-inset" : "",
                    cell.date === selectedDate ? "bg-action-tint text-action-deep" : "",
                  )}
                >
                  {cell.dayNumber}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-border pt-3">
            <p className="typo-caption text-text-muted">{footer.caption}</p>
            {footer.amount === null ? (
              <p className="typo-title text-text-strong tabular-nums">—</p>
            ) : (
              <MaskedAmount
                value={footer.amount}
                masked={reveal.masked}
                sweep={reveal.revealing}
                format={formatWon}
                onToggle={reveal.toggle}
                onSweepEnd={reveal.settle}
                className="typo-title text-text-strong"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
