import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { RecruitmentScheduleStatus } from "@/entities/schedule/model/recruitment-schedule";
import { ERROR_CODE, ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type ApplicationBatchInput = { applyScheduleIds: string[]; withdrawScheduleIds: string[] };

export type ApplicationBatchOutcome =
  | { ok: true; appliedCount: number; withdrawnCount: number }
  | { ok: false; code: ErrorCode; blockedDates?: string[] };

type ApplicationBatchSchedule = {
  id: string;
  workDate: string;
  status: RecruitmentScheduleStatus;
  applicationStatus: "applied" | "withdrawn" | null;
};

type UseApplicationBatchParams = {
  schedules: readonly ApplicationBatchSchedule[];
  onApply: (input: ApplicationBatchInput) => Promise<ApplicationBatchOutcome>;
};

type UndoMemory = { previousByDate: ReadonlyMap<string, boolean>; count: number };

const SNACKBAR_MESSAGE = "근무 가능일을 변경했어요";
const OPEN_STATUS: RecruitmentScheduleStatus = "OPEN";
const CANCELLED_STATUS: RecruitmentScheduleStatus = "CANCELLED";

function initialAppliedSet(schedules: readonly ApplicationBatchSchedule[]): ReadonlySet<string> {
  return new Set(
    schedules
      .filter((schedule) => schedule.applicationStatus === "applied")
      .map((schedule) => schedule.workDate),
  );
}

function symmetricDifferenceSize(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let count = 0;
  for (const key of a) {
    if (!b.has(key)) count += 1;
  }
  for (const key of b) {
    if (!a.has(key)) count += 1;
  }
  return count;
}

export function useApplicationBatch({ schedules, onApply }: UseApplicationBatchParams) {
  const initialApplied = useMemo(() => initialAppliedSet(schedules), [schedules]);
  const [savedApplied, setSavedApplied] = useState(initialApplied);
  const [pending, setPending] = useState(initialApplied);
  const [submitting, startTransition] = useTransition();
  const [lastUndo, setLastUndo] = useState<UndoMemory | null>(null);

  const syncedSchedulesRef = useRef(schedules);
  const scheduleIdByDateRef = useRef(
    new Map(
      schedules
        .filter((schedule) => schedule.status !== CANCELLED_STATUS)
        .map((schedule) => [schedule.workDate, schedule.id]),
    ),
  );

  useEffect(() => {
    if (syncedSchedulesRef.current === schedules) {
      return;
    }
    syncedSchedulesRef.current = schedules;

    const activeSchedules = schedules.filter((schedule) => schedule.status !== CANCELLED_STATUS);

    for (const schedule of activeSchedules) {
      scheduleIdByDateRef.current.set(schedule.workDate, schedule.id);
    }

    const nextSaved = new Set(savedApplied);
    const nextPending = new Set(pending);

    for (const schedule of activeSchedules) {
      const key = schedule.workDate;
      const freshApplied = schedule.applicationStatus === "applied";

      if (freshApplied) {
        nextSaved.add(key);
      } else {
        nextSaved.delete(key);
      }

      const isOpen = schedule.status === OPEN_STATUS;
      const hadOwnEdit = pending.has(key) !== savedApplied.has(key);
      if (isOpen && hadOwnEdit) {
        continue;
      }

      if (freshApplied) {
        nextPending.add(key);
      } else {
        nextPending.delete(key);
      }
    }

    setSavedApplied(nextSaved);
    setPending(nextPending);
  }, [schedules, savedApplied, pending]);

  function toggle(dateKey: string) {
    setPending((previous) => {
      const next = new Set(previous);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
    setLastUndo(null);
  }

  function submit(target: ReadonlySet<string>) {
    const applyDates = Array.from(target).filter((date) => !savedApplied.has(date));
    const withdrawDates = Array.from(savedApplied).filter((date) => !target.has(date));

    if (applyDates.length === 0 && withdrawDates.length === 0) {
      return;
    }

    const applyScheduleIds = applyDates
      .map((date) => scheduleIdByDateRef.current.get(date))
      .filter((id): id is string => id !== undefined);
    const withdrawScheduleIds = withdrawDates
      .map((date) => scheduleIdByDateRef.current.get(date))
      .filter((id): id is string => id !== undefined);

    const previousByDate = new Map<string, boolean>();
    for (const date of applyDates) {
      previousByDate.set(date, false);
    }
    for (const date of withdrawDates) {
      previousByDate.set(date, true);
    }
    const changeCountForThisSave = previousByDate.size;

    startTransition(async () => {
      const outcome = await onApply({ applyScheduleIds, withdrawScheduleIds });

      if (outcome.ok) {
        setSavedApplied(target);
        setPending(target);
        setLastUndo({ previousByDate, count: changeCountForThisSave });
        showSnackbar(SNACKBAR_MESSAGE);
        return;
      }

      if (outcome.code === ERROR_CODE.SCHEDULING_APPLICATION_BLOCKED) {
        const blockedDates = outcome.blockedDates ?? [];
        showSnackbar(`${ERROR_CODES[outcome.code].message} (${blockedDates.join(", ")})`);
        return;
      }
      showSnackbar(ERROR_CODES[outcome.code].message);
    });
  }

  function save() {
    submit(pending);
  }

  function executeUndo() {
    if (lastUndo === null) {
      return;
    }
    const target = new Set(savedApplied);
    for (const [date, wasApplied] of lastUndo.previousByDate) {
      if (wasApplied) {
        target.add(date);
      } else {
        target.delete(date);
      }
    }
    submit(target);
  }

  const changeCount = symmetricDifferenceSize(pending, savedApplied);

  return {
    savedApplied,
    pending,
    toggle,
    save,
    changeCount,
    submitting,
    undo: lastUndo === null ? null : { count: lastUndo.count, execute: executeUndo },
  };
}
