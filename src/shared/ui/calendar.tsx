"use client";

import { format } from "date-fns";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { cn } from "@/shared/lib/cn";

export type CalendarCellState = "none" | "open" | "selected" | "requested" | "closed" | "confirmed";

const STATE_LABEL: Record<CalendarCellState, string> = {
  none: "모집 없음",
  open: "신청 가능",
  selected: "선택됨",
  requested: "신청",
  closed: "마감",
  confirmed: "확정",
};

const STATE_CLASSES: Record<CalendarCellState, string> = {
  none: "bg-disabled-surface text-disabled",
  open: "bg-surface text-text-strong",
  selected: "bg-action-surface text-action",
  requested: "bg-neutral-surface text-neutral",
  closed: "bg-neutral-surface text-neutral",
  confirmed: "bg-action-surface text-action",
};

const DATE_KEY_FORMAT = "yyyy-MM-dd";

type CalendarDateState = {
  date: Date;
  state: CalendarCellState;
};

type CalendarProps = {
  month: Date;
  onMonthChange?: (month: Date) => void;
  dateStates: readonly CalendarDateState[];
  onSelectDate: (date: Date) => void;
};

export function Calendar({ month, onMonthChange, dateStates, onSelectDate }: CalendarProps) {
  const stateByDateKey = new Map(
    dateStates.map((entry) => [format(entry.date, DATE_KEY_FORMAT), entry.state]),
  );

  return (
    <DayPicker
      locale={ko}
      weekStartsOn={0}
      month={month}
      onMonthChange={onMonthChange}
      onDayClick={(date) => onSelectDate(date)}
      components={{
        DayButton: ({ day, modifiers: _modifiers, className, ...props }: DayButtonProps) => {
          const state = stateByDateKey.get(format(day.date, DATE_KEY_FORMAT)) ?? "none";
          const dateLabel = `${day.date.getMonth() + 1}월 ${day.date.getDate()}일`;
          return (
            <button
              {...props}
              type="button"
              disabled={state === "none"}
              aria-label={`${dateLabel} ${STATE_LABEL[state]}`}
              className={cn(
                "flex size-11 flex-col items-center justify-center rounded-md typo-caption",
                STATE_CLASSES[state],
              )}
            >
              {day.date.getDate()}
            </button>
          );
        },
      }}
    />
  );
}
