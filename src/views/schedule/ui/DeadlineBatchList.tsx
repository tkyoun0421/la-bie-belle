"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Check } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import type { DeadlineBatch, DeadlineBatchRow } from "@/views/schedule/model/deadline-batches";
import type { ScheduleEntryState } from "@/views/schedule/model/schedule-cell-state";

const CHIP_LABEL: Partial<Record<ScheduleEntryState, string>> = {
  requested: "신청함",
  confirmed: "확정",
  closed: "마감",
};

const STATE_LABEL: Record<ScheduleEntryState, string> = {
  open: "신청 가능",
  selected: "선택됨",
  requested: "신청함",
  confirmed: "확정",
  closed: "마감",
};

const BAR_CLASSES: Partial<Record<ScheduleEntryState, string>> = {
  confirmed: "before:bg-action",
  requested: "before:bg-action-weak",
};

const CHIP_CLASSES: Record<ScheduleEntryState, string> = {
  open: "",
  selected: "",
  requested: "bg-action-tint-weak text-action-mid",
  confirmed: "bg-action-tint text-action-deep",
  closed: "text-text-weak",
};

function rowDateLabel(workDate: string) {
  return format(new Date(`${workDate}T00:00:00`), "M월 d일 EEEE", { locale: ko });
}

function deadlineLabel(deadline: string) {
  return format(new Date(`${deadline}T00:00:00`), "M월 d일 마감", { locale: ko });
}

type BatchRowProps = {
  row: DeadlineBatchRow;
  onSelect: (workDate: string) => void;
};

function BatchRow({ row, onSelect }: BatchRowProps) {
  const chipLabel = CHIP_LABEL[row.state];

  return (
    <button
      type="button"
      onClick={() => onSelect(row.workDate)}
      aria-label={`${rowDateLabel(row.workDate)} ${STATE_LABEL[row.state]}`}
      aria-pressed={row.selectable ? row.state === "selected" : undefined}
      className={cn(
        "relative flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left",
        "transition-[scale] duration-[var(--duration-feedback)] ease-[var(--ease-out)] active:scale-[0.985]",
        BAR_CLASSES[row.state] &&
          cn(
            "before:absolute before:top-3 before:bottom-3 before:left-0 before:w-[3px]",
            "before:rounded-pill before:content-['']",
            BAR_CLASSES[row.state],
          ),
        row.state === "selected" && "ring-action-outline ring-2 ring-inset",
      )}
    >
      <span
        className={cn(
          "flex-1 typo-body-strong tabular-nums",
          row.state === "closed" ? "text-text-muted" : "text-text-strong",
        )}
      >
        {rowDateLabel(row.workDate)}
      </span>
      {row.state === "selected" ? (
        <span
          aria-hidden
          className="bg-action-tint text-action-deep grid size-5 shrink-0 place-items-center rounded-pill"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : chipLabel ? (
        <span
          aria-hidden
          className={cn(
            "shrink-0 rounded-sm px-2 py-0.5 typo-caption font-semibold",
            CHIP_CLASSES[row.state],
          )}
        >
          {chipLabel}
        </span>
      ) : null}
    </button>
  );
}

type DeadlineBatchListProps = {
  batches: readonly DeadlineBatch[];
  onSelectRow: (workDate: string) => void;
  onToggleBatch: (workDates: readonly string[], select: boolean) => void;
};

export function DeadlineBatchList({ batches, onSelectRow, onToggleBatch }: DeadlineBatchListProps) {
  if (batches.length === 0) {
    return (
      <div className="rounded-xl bg-surface px-4 py-8">
        <p className="text-center typo-body text-text-muted">이번 달 모집이 아직 없어요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {batches.map((batch) => {
        const selectable = batch.rows.filter((row) => row.selectable);
        const allSelected =
          selectable.length > 0 && selectable.every((row) => row.state === "selected");

        return (
          <section key={batch.deadline ?? "passed"} className="rounded-xl bg-surface px-1 py-1.5">
            <div className="flex items-center gap-2.5 px-3 pt-2 pb-1.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="typo-label text-text-strong tabular-nums">
                  {batch.daysLeft === null
                    ? "지나갔어요"
                    : batch.daysLeft === 0
                      ? "오늘 마감"
                      : `${batch.daysLeft}일 남음`}
                </span>
                {batch.deadline === null ? null : (
                  <span className="typo-caption text-text-muted tabular-nums">
                    {deadlineLabel(batch.deadline)}
                  </span>
                )}
              </span>
              {selectable.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    onToggleBatch(
                      selectable.map((row) => row.workDate),
                      !allSelected,
                    )
                  }
                  className="shrink-0 rounded-sm bg-surface-strong px-2.5 py-1 typo-caption font-semibold text-text-strong transition-[scale] duration-[var(--duration-feedback)] ease-[var(--ease-out)] active:scale-95"
                >
                  {allSelected ? "모두 해제" : "모두 선택"}
                </button>
              ) : null}
            </div>
            {batch.rows.map((row, index) => (
              <div key={row.workDate}>
                {index > 0 ? <div aria-hidden className="bg-canvas mx-3 h-px" /> : null}
                <BatchRow row={row} onSelect={onSelectRow} />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
