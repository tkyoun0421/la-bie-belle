import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { NOTIFICATIONS_PATH } from "@/shared/consts/navigation.const";
import { useMonthCursor } from "@/shared/hooks/useMonthCursor";
import { useToast, type ToastState } from "@/shared/hooks/useToast";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { calendarDayState } from "@/shared/model/calendarDayState.policy";
import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";
import { spellMonth } from "@/shared/utils/kstDate";
import { toggleSelectedDate } from "@/shared/utils/submissionSelection.utils";
import { useMyAvailabilityQuery } from "@/entities/availability/services/useMyAvailabilityQuery";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import {
  monthState,
  spellDeadline,
  type MonthState,
} from "@/entities/schedule/model/monthState.policy";
import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { myAssignmentOf } from "@/entities/schedule/utils/agendaRow.utils";
import { hasIncomingRequest } from "@/entities/workRequest/model/incomingRequest.policy";
import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";
import { usePendingApprovalsQuery } from "@/entities/workRequest/services/usePendingApprovalsQuery";
import { useSlotRequestsQuery } from "@/entities/workRequest/services/useSlotRequestsQuery";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";
import { useSubmitAvailabilityMutation } from "@/features/availabilitySubmit/services/useSubmitAvailabilityMutation";
import { SCHEDULE_WORKER_COPY } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import {
  spellNotOpen,
  spellSubmitted,
} from "@/screens/scheduleWorker/utils/workerCopy.utils";

export type ScheduleWorkerParams = {
  month?: string;
  date?: string;
};

export type ScheduleWorkerBodyState = "loading" | MonthState;

export type ScheduleWorkerBody = "loading" | "confirmed" | "picker";

export type ScheduleWorkerView = "calendar" | "position";

export type ScheduleWorkerSheet =
  | {
      kind: "request";
      request: SlotRequest;
    }
  | {
      kind: "cancel";
      assignmentId: string;
      workDate: string;
      position: string;
    }
  | {
      kind: "roster";
      workDate: string;
      myProfileId: string | null;
      cancelRequested: boolean;
    };

export type ScheduleWorkerScreenController = {
  month: string;
  monthTitle: string;
  unread: boolean;
  bodyState: ScheduleWorkerBodyState;
  body: ScheduleWorkerBody;
  view: ScheduleWorkerView;
  showMineOnly: boolean;
  deadlineLine: string | null;
  notice: string | null;
  calendarNote: string;
  cellStateOf: (date: string) => ScheduleDayCellState;
  isToday: (date: string) => boolean;
  canPressDay: (date: string) => boolean;
  pressDay: ((date: string) => void) | undefined;
  expanded: string[];
  myProfileId: string | null;
  sending: boolean;
  sheet: ScheduleWorkerSheet | null;
  toast: ToastState | null;
  closeTop: (() => boolean) | null;
  goNotifications: () => void;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  showView: (next: string) => void;
  showMine: (only: boolean) => void;
  toggleAgendaDay: (workDate: string) => void;
  askCancelOn: (workDate: string) => void;
  askCancel: () => void;
  requestSwap: () => void;
  submit: () => void;
  seatTaken: (line: string) => void;
  closeSheet: () => void;
  dismissToast: () => void;
};

export function useScheduleWorkerScreen({
  month: monthParam,
  date: dateParam,
}: ScheduleWorkerParams): ScheduleWorkerScreenController {
  const router = useRouter();
  const pathname = usePathname();
  const today = kstToday();

  const [view, setView] = useState<ScheduleWorkerView>("calendar");
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [openDate, setOpenDate] = useState<string | null>(dateParam ?? null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [claimed, setClaimed] = useState<string | null>(null);

  const { toast, showToast, dismissToast } = useToast();

  const leaveMonth = useCallback(() => {
    setOpenDate(null);
    setCancelling(false);
    setClaimed(null);
    setExpanded([]);
  }, []);

  const { month, goPrev, goNext, jumpTo } = useMonthCursor(
    monthParam ?? dateParam?.slice(0, 7) ?? today.slice(0, 7),
    leaveMonth,
  );

  const { profile } = useMyStanding(supabase);
  const unreadCount = useUnreadCountQuery(supabase);
  const { data: monthWindow } = useMonthWindowQuery(supabase, month);
  const { data: days } = useMonthScheduleQuery(supabase, month);
  const { data: myDates } = useMyAvailabilityQuery(supabase, month);
  const { data: slotRequests } = useSlotRequestsQuery(supabase, month);
  const { data: myCancelRequests } = usePendingApprovalsQuery(supabase);

  const {
    mutate: send,
    isPending: sending,
    isSuccess: sent,
    isError: sendFailed,
    reset: resetSend,
  } = useSubmitAvailabilityMutation(supabase);

  const myProfileId = profile?.id ?? null;

  useEffect(() => {
    const asked = monthParam ?? dateParam?.slice(0, 7);

    if (asked !== undefined) {
      jumpTo(asked);
    }
    setOpenDate(dateParam ?? null);
    setCancelling(false);
  }, [monthParam, dateParam, jumpTo]);

  useEffect(() => {
    setSelected(myDates ?? []);
  }, [myDates]);

  useEffect(() => {
    if (!sent) {
      return;
    }

    showToast("success", spellSubmitted(month));
    resetSend();
  }, [sent, month, resetSend, showToast]);

  useEffect(() => {
    if (!sendFailed) {
      return;
    }

    showToast("info", SCHEDULE_WORKER_COPY.sendFailed);
    resetSend();
  }, [sendFailed, resetSend, showToast]);

  const dayOf = useMemo(() => {
    const byDate = new Map<string, ScheduleDay>();

    for (const day of days ?? []) {
      byDate.set(day.workDate, day);
    }

    return byDate;
  }, [days]);

  const requestsOf = useMemo(() => {
    const byDate = new Map<string, SlotRequest[]>();

    for (const request of slotRequests ?? []) {
      const date = request.workDate;

      byDate.set(date, [...(byDate.get(date) ?? []), request]);
    }

    return byDate;
  }, [slotRequests]);

  const state = monthState({ schedule: monthWindow ?? null, today });
  const loading = monthWindow === undefined || days === undefined;
  const collecting = state === "collecting";
  const confirmed = state === "confirmed";
  const deadline = monthWindow?.applicationDeadline ?? null;

  const openDay = dayOf.get(openDate ?? "") ?? null;

  const openRequest =
    openDate === null || myProfileId === null
      ? null
      : ((requestsOf.get(openDate) ?? []).find((request) =>
          request.candidates.some(
            (candidate) =>
              candidate.profileId === myProfileId &&
              candidate.status === "pending",
          ),
        ) ?? null);

  const myShift =
    openDay === null || myProfileId === null
      ? null
      : (openDay.assignments.find(
          (assignment) =>
            assignment.profileId === myProfileId &&
            assignment.kind === "regular" &&
            assignment.endedAt === null,
        ) ?? null);

  const cancelAsking = (myCancelRequests ?? []).some(
    (request) => request.assignmentId === myShift?.id,
  );

  const anyIncoming = [...requestsOf.keys()].some((date) =>
    hasIncomingRequest(requestsOf.get(date) ?? [], myProfileId),
  );

  const closeSheet = useCallback(() => {
    setOpenDate(null);
    setCancelling(false);
  }, []);

  const seatTaken = useCallback(
    (line: string) => {
      setClaimed(line);
      showToast("info", SCHEDULE_WORKER_COPY.seatTaken);
      closeSheet();
    },
    [closeSheet, showToast],
  );

  const closeTop = useMemo(() => {
    if (openDate === null) {
      return null;
    }

    return () => {
      closeSheet();

      return true;
    };
  }, [openDate, closeSheet]);

  const openSheetOn = (date: string, asCancel: boolean) => {
    setOpenDate(date);
    setCancelling(asCancel);
  };

  const sheet: ScheduleWorkerSheet | null =
    openRequest !== null
      ? { kind: "request", request: openRequest }
      : openDay === null
        ? null
        : cancelling && myShift !== null
          ? {
              kind: "cancel",
              assignmentId: myShift.id,
              workDate: openDay.workDate,
              position: myShift.position,
            }
          : {
              kind: "roster",
              workDate: openDay.workDate,
              myProfileId,
              cancelRequested: cancelAsking,
            };

  return {
    month,
    monthTitle: spellMonth(month),
    unread: (unreadCount.data ?? 0) > 0,
    bodyState: loading ? "loading" : state,
    body: loading ? "loading" : state === "confirmed" ? "confirmed" : "picker",
    view,
    showMineOnly,
    deadlineLine:
      loading || confirmed || deadline === null
        ? null
        : spellDeadline(deadline, today),
    notice:
      state === "not_created"
        ? spellNotOpen(month)
        : state === "closed_awaiting_confirmation"
          ? SCHEDULE_WORKER_COPY.awaitingConfirmation
          : null,
    calendarNote:
      claimed ??
      (anyIncoming
        ? SCHEDULE_WORKER_COPY.calendarNoteWithRequest
        : SCHEDULE_WORKER_COPY.calendarNote),
    cellStateOf: (date) => {
      if (!confirmed) {
        return selected.includes(date) ? "picked" : "unconfirmed";
      }

      const day = dayOf.get(date);

      return calendarDayState({
        isOpen: day !== undefined,
        isMyAssignment:
          day !== undefined &&
          myAssignmentOf(day.assignments, myProfileId) !== null,
        hasIncomingRequest: hasIncomingRequest(
          requestsOf.get(date) ?? [],
          myProfileId,
        ),
        showMineOnly,
      });
    },
    isToday: (date) => date === today,
    canPressDay: (date) => collecting || dayOf.has(date),
    pressDay:
      confirmed || collecting
        ? (date) => {
            if (collecting) {
              setSelected(toggleSelectedDate(selected, date));
              return;
            }

            openSheetOn(date, false);
          }
        : undefined,
    expanded,
    myProfileId,
    sending,
    sheet,
    toast,
    closeTop,
    goNotifications: () =>
      router.push(`${NOTIFICATIONS_PATH}?from=${pathname}`),
    goPrevMonth: goPrev,
    goNextMonth: goNext,
    showView: (next) => setView(next === "position" ? "position" : "calendar"),
    showMine: setShowMineOnly,
    toggleAgendaDay: (workDate) =>
      setExpanded(toggleSelectedDate(expanded, workDate)),
    askCancelOn: (workDate) => openSheetOn(workDate, true),
    askCancel: () => setCancelling(true),
    requestSwap: () => undefined,
    submit: () => send({ month, dates: selected }),
    seatTaken,
    closeSheet,
    dismissToast,
  };
}
