"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { addTransitionType, startTransition, useMemo, useState } from "react";

import type { RecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import {
  useApplicationBatch,
  type ApplicationBatchInput,
  type ApplicationBatchOutcome,
} from "@/features/application/hooks/useApplicationBatch";
import { ApplicationChangeBar } from "@/features/application/ui/ApplicationChangeBar";
import { PushPrimingSheet } from "@/features/push/ui/PushPrimingSheet";
import { Calendar } from "@/shared/ui/calendar";
import { SegmentedControl } from "@/shared/ui/segmented-control";
import { toDeadlineBatches } from "@/views/schedule/model/deadline-batches";
import { toScheduleCellStates } from "@/views/schedule/model/schedule-cell-state";
import { DeadlineBatchList } from "@/views/schedule/ui/DeadlineBatchList";
import { RouterPullToRefresh } from "@/widgets/pull-to-refresh/ui/RouterPullToRefresh";

const DATE_KEY_FORMAT = "yyyy-MM-dd";
const MONTH_PARAM_FORMAT = "yyyy-MM";
const SCHEDULE_PATH = "/schedule";

type ScheduleViewMode = "calendar" | "list";

const VIEW_MODE_OPTIONS: readonly { value: ScheduleViewMode; label: string }[] = [
  { value: "calendar", label: "달력" },
  { value: "list", label: "목록" },
];

type ScheduleViewProps = {
  month: string;
  today: string;
  schedules: readonly RecruitmentScheduleWithApplication[];
  onApply: (input: ApplicationBatchInput) => Promise<ApplicationBatchOutcome>;
  defaultViewMode?: ScheduleViewMode;
};

export function ScheduleView({
  month: monthParam,
  today,
  schedules,
  onApply,
  defaultViewMode = "calendar",
}: ScheduleViewProps) {
  const router = useRouter();
  const [applicationSavedSignal, setApplicationSavedSignal] = useState(0);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>(defaultViewMode);

  async function handleApply(input: ApplicationBatchInput): Promise<ApplicationBatchOutcome> {
    const outcome = await onApply(input);
    if (outcome.ok) {
      setApplicationSavedSignal((count) => count + 1);
    }
    return outcome;
  }

  const batch = useApplicationBatch({ schedules, onApply: handleApply });
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

  const batches = useMemo(
    () =>
      toDeadlineBatches({
        today,
        schedules,
        pending: batch.pending,
        savedApplied: batch.savedApplied,
      }),
    [today, schedules, batch.pending, batch.savedApplied],
  );

  function handleSelectWorkDate(key: string) {
    const schedule = scheduleByDate.get(key);

    if (schedule === undefined) {
      return;
    }
    if (schedule.status !== "OPEN") {
      startTransition(() => {
        addTransitionType?.("nav-forward");
        router.push(`${SCHEDULE_PATH}/${key}`);
      });
      return;
    }
    batch.toggle(key);
  }

  function handleSelectDate(date: Date) {
    handleSelectWorkDate(format(date, DATE_KEY_FORMAT));
  }

  function handleMonthChange(nextMonth: Date) {
    router.push(`${SCHEDULE_PATH}?month=${format(nextMonth, MONTH_PARAM_FORMAT)}`);
  }

  return (
    <RouterPullToRefresh>
      <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-3 p-4 pb-28">
        <h1 className="px-1 typo-display text-text-strong">일정</h1>
        <SegmentedControl
          label="일정 보기 방식"
          options={VIEW_MODE_OPTIONS}
          value={viewMode}
          onChange={setViewMode}
        />
        {viewMode === "calendar" ? (
          <div className="rounded-xl bg-surface p-3">
            <Calendar
              month={month}
              today={new Date(`${today}T00:00:00`)}
              dateStates={dateStates}
              onSelectDate={handleSelectDate}
              onMonthChange={handleMonthChange}
            />
          </div>
        ) : (
          <DeadlineBatchList
            batches={batches}
            onSelectRow={handleSelectWorkDate}
            onToggleBatch={batch.selectMany}
          />
        )}
        <ApplicationChangeBar
          changeCount={batch.changeCount}
          submitting={batch.submitting}
          onSave={batch.save}
          undo={batch.undo}
        />
      </main>
      <PushPrimingSheet trigger={applicationSavedSignal} />
    </RouterPullToRefresh>
  );
}
