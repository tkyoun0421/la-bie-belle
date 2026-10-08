import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { kstToday } from "@/shared/lib/kstToday.lib";
import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";
import { useMyAvailabilityQuery } from "@/entities/availability/services/useMyAvailabilityQuery";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import type { ScheduleDay } from "@/entities/schedule/api/schedule.dto";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";
import { usePendingApprovalsQuery } from "@/entities/workRequest/services/usePendingApprovalsQuery";
import { useSlotRequestsQuery } from "@/entities/workRequest/services/useSlotRequestsQuery";
import { useSubmitAvailabilityMutation } from "@/features/availabilitySubmit/services/useSubmitAvailabilityMutation";
import { useCreateCancelRequestMutation } from "@/features/workRequest/services/useCreateCancelRequestMutation";
import { useRespondRequestMutation } from "@/features/workRequest/services/useRespondRequestMutation";
import { SCHEDULE_WORKER_COPY } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import { answerFailure } from "@/screens/scheduleWorker/model/answerFailure.policy";
import { calendarDayState } from "@/screens/scheduleWorker/model/calendarDayState.policy";
import {
  cancelRequestBadge,
  isValidCancelReason,
} from "@/screens/scheduleWorker/model/cancelRequestSheet.policy";
import {
  canShowShiftActions,
  daySheetSubtitle,
  rosterHeadcount,
  rosterOfDay,
  type RosterRow,
} from "@/screens/scheduleWorker/model/daySheet.policy";
import { hasIncomingRequest } from "@/screens/scheduleWorker/model/incomingRequest.policy";
import {
  monthState,
  shiftMonth,
  spellDeadline,
  spellMonth,
  type MonthState,
} from "@/screens/scheduleWorker/model/monthState.policy";
import {
  requestSheetState,
  type RequestSheetState,
} from "@/screens/scheduleWorker/model/requestSheet.policy";
import type { AgendaEntry } from "@/screens/scheduleWorker/ui/ScheduleAgenda";
import {
  myAssignmentOf,
  spellWorkDate,
} from "@/screens/scheduleWorker/utils/agendaRow.utils";
import { toggleSelectedDate } from "@/screens/scheduleWorker/utils/submissionSelection.utils";
import {
  cancelSheetTitle,
  claimedLine,
  requestSubtitle,
  spellNotOpen,
  spellSubmitted,
} from "@/screens/scheduleWorker/utils/workerCopy.utils";

export type ScheduleWorkerParams = {
  month?: string;
  date?: string;
};

export type ScheduleWorkerBodyState = "loading" | MonthState;

export type ScheduleWorkerView = "calendar" | "position";

export type ScheduleWorkerSheet =
  | {
      kind: "request";
      subtitle: string;
      state: RequestSheetState;
      sending: boolean;
      failed: boolean;
    }
  | {
      kind: "cancel";
      title: string;
      reason: string;
      canSend: boolean;
      sending: boolean;
      failed: boolean;
    }
  | {
      kind: "roster";
      title: string;
      subtitle: string;
      rows: RosterRow[];
      myProfileId: string | null;
      myBadge: string | undefined;
      showActions: boolean;
      actionsEnabled: boolean;
    };

export type ScheduleWorkerScreenController = {
  month: string;
  monthTitle: string;
  unread: boolean;
  bodyState: ScheduleWorkerBodyState;
  view: ScheduleWorkerView;
  showMineOnly: boolean;
  deadlineLine: string | null;
  notice: string | null;
  calendarNote: string;
  cellStateOf: (date: string) => ScheduleDayCellState;
  isToday: (date: string) => boolean;
  canPressDay: (date: string) => boolean;
  pressDay: ((date: string) => void) | undefined;
  agendaEntries: AgendaEntry[];
  expanded: string[];
  myProfileId: string | null;
  sending: boolean;
  sheet: ScheduleWorkerSheet | null;
  toast: string | null;
  closeTop: (() => boolean) | null;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  showView: (next: string) => void;
  showMine: (only: boolean) => void;
  toggleAgendaDay: (workDate: string) => void;
  askCancelOn: (workDate: string) => void;
  askCancel: () => void;
  writeReason: (typed: string) => void;
  sendCancel: () => void;
  requestSwap: () => void;
  accept: () => void;
  decline: () => void;
  submit: () => void;
  closeSheet: () => void;
  dismissToast: () => void;
};

export function useScheduleWorkerScreen({
  month: monthParam,
  date: dateParam,
}: ScheduleWorkerParams): ScheduleWorkerScreenController {
  const today = kstToday();

  const [month, setMonth] = useState(
    monthParam ?? dateParam?.slice(0, 7) ?? today.slice(0, 7),
  );
  const [view, setView] = useState<ScheduleWorkerView>("calendar");
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [openDate, setOpenDate] = useState<string | null>(dateParam ?? null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [claimed, setClaimed] = useState<string | null>(null);
  const [answering, setAnswering] = useState<SlotRequest | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const serverNowMs = nowWithOffset(Date.now(), clockOffset);

  const { data: sessionUser } = useSessionUserQuery(supabase);
  const { data: profile } = useMyProfileRowQuery(
    supabase,
    sessionUser?.id ?? null,
  );
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

  const {
    mutate: answer,
    isPending: sendingAnswer,
    isSuccess: answered,
    error: answerError,
    reset: resetAnswer,
  } = useRespondRequestMutation(supabase);

  const {
    mutate: sendCancelRequest,
    isPending: sendingCancel,
    isSuccess: cancelAsked,
    isError: cancelFailed,
    reset: resetCancel,
  } = useCreateCancelRequestMutation(supabase);

  const myProfileId = profile?.id ?? null;

  useEffect(() => {
    const asked = monthParam ?? dateParam?.slice(0, 7);

    if (asked !== undefined) {
      setMonth(asked);
    }
    setOpenDate(dateParam ?? null);
    setCancelling(false);
  }, [monthParam, dateParam]);

  useEffect(() => {
    setSelected(myDates ?? []);
  }, [myDates]);

  useEffect(() => {
    if (!sent) {
      return;
    }

    setToast(spellSubmitted(month));
    resetSend();
  }, [sent, month, resetSend]);

  useEffect(() => {
    if (!sendFailed) {
      return;
    }

    setToast(SCHEDULE_WORKER_COPY.sendFailed);
    resetSend();
  }, [sendFailed, resetSend]);

  useEffect(() => {
    if (!answered) {
      return;
    }

    setAnswering(null);
    setOpenDate(null);
    resetAnswer();
  }, [answered, resetAnswer]);

  const failedAnswer = answerFailure(answerError);

  useEffect(() => {
    if (failedAnswer !== "seat_taken") {
      return;
    }

    setClaimed(answering === null ? null : claimedLine(answering));
    setAnswering(null);
    setOpenDate(null);
    setToast(SCHEDULE_WORKER_COPY.seatTaken);
    resetAnswer();
  }, [failedAnswer, answering, resetAnswer]);

  const dayOf = useMemo(() => {
    const byDate = new Map<string, ScheduleDay>();

    for (const day of days ?? []) {
      byDate.set(day.work_date, day);
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
  const openRoster = openDay === null ? [] : rosterOfDay(openDay);
  const openMine =
    openDay === null ? null : myAssignmentOf(openDay.assignments, myProfileId);

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
            assignment.profile_id === myProfileId &&
            assignment.kind === "regular" &&
            assignment.ended_at === null,
        ) ?? null);

  const cancelAsking = (myCancelRequests ?? []).some(
    (request) => request.assignmentId === myShift?.id,
  );

  const agendaEntries: AgendaEntry[] = (days ?? [])
    .map((day) => {
      const mine = myAssignmentOf(day.assignments, myProfileId);

      return {
        workDate: day.work_date,
        myAssignment: mine,
        rows: rosterOfDay(day),
        showActions: canShowShiftActions({
          isMyAssignment: mine !== null,
          workDate: day.work_date,
          today,
        }),
      };
    })
    .filter((entry) => !showMineOnly || entry.myAssignment !== null);

  const anyIncoming = [...requestsOf.keys()].some((date) =>
    hasIncomingRequest(requestsOf.get(date) ?? [], myProfileId),
  );

  const closeSheet = useCallback(() => {
    setOpenDate(null);
    setCancelling(false);
    setReason("");
    resetAnswer();
    resetCancel();
  }, [resetAnswer, resetCancel]);

  useEffect(() => {
    if (cancelAsked) {
      closeSheet();
    }
  }, [cancelAsked, closeSheet]);

  const closeTop = useMemo(() => {
    if (openDate === null) {
      return null;
    }

    return () => {
      closeSheet();

      return true;
    };
  }, [openDate, closeSheet]);

  const goMonth = (step: number) => {
    setMonth(shiftMonth(month, step));
    setOpenDate(null);
    setCancelling(false);
    setReason("");
    setClaimed(null);
    setExpanded([]);
  };

  const openSheetOn = (date: string, asCancel: boolean) => {
    setOpenDate(date);
    setCancelling(asCancel);
    setReason("");
  };

  const sheet: ScheduleWorkerSheet | null =
    openRequest !== null
      ? {
          kind: "request",
          subtitle: requestSubtitle(openRequest),
          state: requestSheetState({
            closedAt: openRequest.closedAt,
            expiresAt: openRequest.expiresAt,
            serverNowMs,
          }),
          sending: sendingAnswer,
          failed: failedAnswer === "unreachable",
        }
      : openDay === null
        ? null
        : cancelling && myShift !== null
          ? {
              kind: "cancel",
              title: cancelSheetTitle(openDay.work_date, myShift.position),
              reason,
              canSend: isValidCancelReason(reason),
              sending: sendingCancel,
              failed: cancelFailed,
            }
          : {
              kind: "roster",
              title: spellWorkDate(openDay.work_date),
              subtitle: daySheetSubtitle(
                openDay.starts_at,
                openDay.ends_at,
                rosterHeadcount(openRoster),
              ),
              rows: openRoster,
              myProfileId,
              myBadge: cancelRequestBadge(cancelAsking) ?? undefined,
              showActions: canShowShiftActions({
                isMyAssignment: openMine !== null,
                workDate: openDay.work_date,
                today,
              }),
              actionsEnabled: canShowShiftActions({
                isMyAssignment: openMine !== null,
                workDate: openDay.work_date,
                today,
                hasActiveCancelRequest: cancelAsking,
              }),
            };

  return {
    month,
    monthTitle: spellMonth(month),
    unread: (unreadCount.data ?? 0) > 0,
    bodyState: loading ? "loading" : state,
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
    agendaEntries,
    expanded,
    myProfileId,
    sending,
    sheet,
    toast,
    closeTop,
    goPrevMonth: () => goMonth(-1),
    goNextMonth: () => goMonth(1),
    showView: (next) => setView(next === "position" ? "position" : "calendar"),
    showMine: setShowMineOnly,
    toggleAgendaDay: (workDate) =>
      setExpanded(toggleSelectedDate(expanded, workDate)),
    askCancelOn: (workDate) => openSheetOn(workDate, true),
    askCancel: () => setCancelling(true),
    writeReason: setReason,
    sendCancel: () => {
      if (myShift !== null) {
        sendCancelRequest({
          assignmentId: myShift.id,
          reason: reason.trim(),
        });
      }
    },
    requestSwap: () => undefined,
    accept: () => {
      if (openRequest !== null) {
        setAnswering(openRequest);
        answer({ requestId: openRequest.id, answer: "accept" });
      }
    },
    decline: () => {
      if (openRequest !== null) {
        setAnswering(openRequest);
        answer({ requestId: openRequest.id, answer: "decline" });
      }
    },
    submit: () => send({ month, dates: selected }),
    closeSheet,
    dismissToast: () => setToast(null),
  };
}
