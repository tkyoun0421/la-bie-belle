"use client";

import { format } from "date-fns";
import { Check } from "lucide-react";
import { createContext, useContext, useMemo } from "react";
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

const STATE_BADGE: Partial<Record<CalendarCellState, string>> = {
  requested: "신청",
  closed: "마감",
  confirmed: "확정",
};

const DATE_KEY_FORMAT = "yyyy-MM-dd";

type CalendarDateState = {
  date: Date;
  state: CalendarCellState;
};

const CalendarStateContext = createContext<ReadonlyMap<string, CalendarCellState>>(new Map());

function CalendarDayButton({ day, modifiers, className: _className, ...props }: DayButtonProps) {
  const stateByDateKey = useContext(CalendarStateContext);
  const state = stateByDateKey.get(format(day.date, DATE_KEY_FORMAT)) ?? "none";
  const dateLabel = `${day.date.getMonth() + 1}월 ${day.date.getDate()}일`;
  const badge = STATE_BADGE[state];

  return (
    <button
      {...props}
      type="button"
      disabled={state === "none"}
      aria-label={`${dateLabel} ${STATE_LABEL[state]}`}
      className={cn(
        "flex size-11 flex-col items-center justify-center gap-0.5 rounded-md typo-caption",
        STATE_CLASSES[state],
        modifiers.today && "ring-1 ring-action ring-inset",
      )}
    >
      <span className="leading-none tabular-nums">{day.date.getDate()}</span>
      {state === "selected" ? <Check aria-hidden className="size-3" /> : null}
      {badge ? (
        <span aria-hidden className="text-[9px] leading-none font-semibold">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

type CalendarProps = {
  month: Date;
  onMonthChange?: (month: Date) => void;
  dateStates: readonly CalendarDateState[];
  onSelectDate: (date: Date) => void;
  today?: Date;
};

export function Calendar({ month, onMonthChange, dateStates, onSelectDate, today }: CalendarProps) {
  const stateByDateKey = useMemo(
    () => new Map(dateStates.map((entry) => [format(entry.date, DATE_KEY_FORMAT), entry.state])),
    [dateStates],
  );

  return (
    <CalendarStateContext.Provider value={stateByDateKey}>
      <DayPicker
        locale={ko}
        weekStartsOn={0}
        month={month}
        today={today}
        onMonthChange={onMonthChange}
        onDayClick={(date) => onSelectDate(date)}
        components={{ DayButton: CalendarDayButton }}
      />
    </CalendarStateContext.Provider>
  );
}
