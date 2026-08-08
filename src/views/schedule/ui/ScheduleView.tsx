"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import type { RecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import {
  useApplicationBatch,
  type ApplicationBatchInput,
  type ApplicationBatchOutcome,
} from "@/features/application/hooks/useApplicationBatch";
import { ApplicationChangeBar } from "@/features/application/ui/ApplicationChangeBar";
import { Calendar } from "@/shared/ui/calendar";
import { toScheduleCellStates } from "@/views/schedule/model/schedule-cell-state";

const DATE_KEY_FORMAT = "yyyy-MM-dd";
const MONTH_PARAM_FORMAT = "yyyy-MM";
const SCHEDULE_PATH = "/schedule";

type ScheduleViewProps = {
  month: string;
  today: string;
  schedules: readonly RecruitmentScheduleWithApplication[];
  onApply: (input: ApplicationBatchInput) => Promise<ApplicationBatchOutcome>;
};

export function ScheduleView({ month: monthParam, today, schedules, onApply }: ScheduleViewProps) {
  const router = useRouter();
  const batch = useApplicationBatch({ schedules, onApply });
  const month = useMemo(() => new Date(`${monthParam}-01T00:00:00`), [monthParam]);

  const scheduleByDate = useMemo(
    () =>
      new Map(
        schedules
          .filter((schedule) => schedule.status !== "CANCELLED")
          .map((schedule) => [schedule.workDate, schedule]),
      ),
    [schedules],
  );

  const dateStates = useMemo(
    () =>
      toScheduleCellStates({
        month,
        schedules,
        pending: batch.pending,
        savedApplied: batch.savedApplied,
      }),
    [month, schedules, batch.pending, batch.savedApplied],
  );

  function handleSelectDate(date: Date) {
    const key = format(date, DATE_KEY_FORMAT);
    const schedule = scheduleByDate.get(key);

    if (schedule === undefined) {
      return;
    }
    if (schedule.status !== "OPEN") {
      router.push(`${SCHEDULE_PATH}/${key}`);
      return;
    }
    batch.toggle(key);
  }

  function handleMonthChange(nextMonth: Date) {
    router.push(`${SCHEDULE_PATH}?month=${format(nextMonth, MONTH_PARAM_FORMAT)}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-28">
      <h1 className="typo-display text-text-strong">일정</h1>
      <Calendar
        month={month}
        today={new Date(`${today}T00:00:00`)}
        dateStates={dateStates}
        onSelectDate={handleSelectDate}
        onMonthChange={handleMonthChange}
      />
      <ApplicationChangeBar
        changeCount={batch.changeCount}
        submitting={batch.submitting}
        onSave={batch.save}
        undo={batch.undo}
      />
    </main>
  );
}
