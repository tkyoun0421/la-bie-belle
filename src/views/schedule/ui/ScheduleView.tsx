"use client";

import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";

import type { ScheduleApplication } from "@/entities/schedule/model/application";
import type { WorkSchedule } from "@/entities/schedule/model/work-schedule";
import { Button } from "@/shared/ui/button";
import { Calendar, type CalendarCellState } from "@/shared/ui/calendar";
import { showSnackbar } from "@/shared/ui/snackbar";

const DATE_KEY_FORMAT = "yyyy-MM-dd";

type ScheduleViewProps = {
  month: Date;
  workSchedules: readonly WorkSchedule[];
  applications: readonly ScheduleApplication[];
  confirmedDates: readonly string[];
  onOpenDetail: (date: string) => void;
};

function toCellState(
  schedule: WorkSchedule | undefined,
  isPending: boolean,
  isSavedApplied: boolean,
  isConfirmed: boolean,
): CalendarCellState {
  if (isConfirmed) {
    return "confirmed";
  }
  if (!schedule) {
    return "none";
  }
  if (schedule.status === "closed") {
    return "closed";
  }
  if (isPending) {
    return isSavedApplied ? "requested" : "selected";
  }
  return "open";
}

function symmetricDifferenceSize(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  let count = 0;
  for (const key of a) {
    if (!b.has(key)) count += 1;
  }
  for (const key of b) {
    if (!a.has(key)) count += 1;
  }
  return count;
}

export function ScheduleView({
  month,
  workSchedules,
  applications,
  confirmedDates,
  onOpenDetail,
}: ScheduleViewProps) {
  const initialApplied = useMemo(
    () => new Set(applications.map((application) => application.date)),
    [applications],
  );
  const [savedApplied, setSavedApplied] = useState(initialApplied);
  const [pending, setPending] = useState(initialApplied);
  const confirmedSet = useMemo(() => new Set(confirmedDates), [confirmedDates]);
  const scheduleByDate = useMemo(
    () => new Map(workSchedules.map((schedule) => [schedule.date, schedule])),
    [workSchedules],
  );

  const monthDays = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
    [month],
  );

  const dateStates = monthDays.map((date) => {
    const key = format(date, DATE_KEY_FORMAT);
    return {
      date,
      state: toCellState(
        scheduleByDate.get(key),
        pending.has(key),
        savedApplied.has(key),
        confirmedSet.has(key),
      ),
    };
  });

  const changeCount = symmetricDifferenceSize(pending, savedApplied);

  function handleSelectDate(date: Date) {
    const key = format(date, DATE_KEY_FORMAT);
    const schedule = scheduleByDate.get(key);

    if (confirmedSet.has(key) || schedule?.status === "closed") {
      onOpenDetail(key);
      return;
    }
    if (schedule?.status !== "open") {
      return;
    }

    setPending((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleSave() {
    if (changeCount === 0) {
      return;
    }
    const previous = savedApplied;
    const next = pending;
    setSavedApplied(next);
    showSnackbar("근무 가능일을 변경했어요", {
      action: {
        label: `방금 변경한 ${changeCount}개 날짜 되돌리기`,
        onClick: () => {
          setSavedApplied(previous);
          setPending(previous);
        },
      },
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-28">
      <h1 className="typo-display text-text-strong">일정</h1>
      <Calendar month={month} dateStates={dateStates} onSelectDate={handleSelectDate} />
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 flex items-center justify-between border-t border-border bg-surface p-4">
        <span className="typo-label text-text-strong">{changeCount}개 변경</span>
        <Button variant="primary" disabled={changeCount === 0} onClick={handleSave}>
          신청하기
        </Button>
      </div>
    </main>
  );
}
