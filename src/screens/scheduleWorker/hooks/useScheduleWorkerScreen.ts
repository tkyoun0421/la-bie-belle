import { useCallback, useEffect, useMemo, useState } from "react";
import type { DB } from "@/shared/api/database";
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
import type { SlotRequest } from "@/entities/workRequest/api/workRequest.dto";
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

/**
 * 근무자가 보는 근무표의 controller다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleWorker.md`고 완료 조건은
 * `docs/2-design/spec/schedule-worker.md`다.
 *
 * **한 화면이 달의 상태를 탄다.** 확정된 달은 근무표고 확정 전 달은 같은 자리가 제출
 * 모드다 — 별도 제출 화면이 없다. 무엇을 그릴지는 읽는 중까지 접은 `bodyState` 하나가
 * 가른다.
 *
 * **고른 날짜는 아직 안 보낸 로컬 상태다.** 누르면 화면이 바로 칠하고 서버에는 「보내기」가
 * 한 번 보낸다([근무 신청 내기](../../../../docs/2-design/modules/schedule/design.md#근무-신청-내기)).
 * 낙관적 업데이트가 아니라서 보내기가 실패해도 고른 날이 그대로 남는다.
 *
 * **날짜 하나에 문이 둘이다.** 그 날 내게 온 근무 요청이 살아 있으면 요청 시트가 열리고
 * 아니면 명단 시트다 — 알림도 달력 칸도 같은 `?date=`로 들어오는데(「목적과 진입」) 요청에
 * 답하는 것이 그 자리에서 할 일이라 명단을 한 번 더 지나게 하지 않는다. 그 셋이 한 겹을
 * 나눠 쓰므로 어느 얼굴인지를 `sheet.kind`가 들고, 얼굴마다 다른 칸은 그 갈래 안에만 산다.
 *
 * **늦은 수락은 오류 블록이 아니다.** 시트를 닫고 토스트로 말한 뒤 달력 아래 줄에 그 사건을
 * 남긴다 — 되살아나지 않는 요청이라 시트에 붙잡아 둘 일이 없다(「실패와 경합」). 끊긴
 * 통신과 가르는 것은 [`answerFailure`](../model/answerFailure.policy.ts)다.
 *
 * **취소 사유를 조각이 아니라 여기가 든다.** 적은 글이 그대로 관리자에게 가고 보내는 동안
 * 잠기고 실패하면 남아야 해서 통신에 매여 있다 — 조각은 제 controller를 못 가진다.
 *
 * **기기 뒤로를 여기서 안 건다.** 무엇을 닫을지는 이 자리가 알지만 `BackHandler`에 손을
 * 거는 일은 네이티브라, 닫는 손 하나(`closeTop`)만 내고 잇는 것은
 * [`useHardwareBack`](../../../shared/hooks/useHardwareBack.ts)이 한다.
 *
 * **보낼 데는 안 든다.** 알림 목록으로 가는 문은 `.tsx`가 쥔다.
 *
 * **아직 안 채운 셋.** 인증 상태 열과 현황 줄은 `check_ins` 표가 서는 attendance task 뒤에
 * 차고, 교대 요청 시트는 swap task가 낸다. 달 고르기 시트도 아직이다
 * (`docs/3-build/plans/schedule-worker.md`의 AC-09).
 */

export type ScheduleWorkerParams = {
  month?: string;
  date?: string;
};

export type ScheduleWorkerBodyState = "loading" | MonthState;

export type ScheduleWorkerView = "calendar" | "position";

/** 겹 하나를 셋이 나눠 쓴다 — 어느 얼굴인지가 정해지면 그 얼굴의 칸만 선다. */
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
  /** 달력이 그릴 달이다 — 앱바가 부르는 말은 `monthTitle`이 따로 든다. */
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
  /** 조회만 하는 달에는 안 선다 — 칸이 눌려도 열 것이 없다. */
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

export function useScheduleWorkerScreen(
  client: DB,
  { month: monthParam, date: dateParam }: ScheduleWorkerParams,
): ScheduleWorkerScreenController {
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

  const { data: sessionUser } = useSessionUserQuery(client);
  const { data: profile } = useMyProfileRowQuery(
    client,
    sessionUser?.id ?? null,
  );
  const unreadCount = useUnreadCountQuery(client);
  const { data: monthWindow } = useMonthWindowQuery(client, month);
  const { data: days } = useMonthScheduleQuery(client, month);
  const { data: myDates } = useMyAvailabilityQuery(client, month);
  const { data: slotRequests } = useSlotRequestsQuery(client, month);
  const { data: myCancelRequests } = usePendingApprovalsQuery(client);

  const {
    mutate: send,
    isPending: sending,
    isSuccess: sent,
    isError: sendFailed,
    reset: resetSend,
  } = useSubmitAvailabilityMutation(client);

  const {
    mutate: answer,
    isPending: sendingAnswer,
    isSuccess: answered,
    error: answerError,
    reset: resetAnswer,
  } = useRespondRequestMutation(client);

  const {
    mutate: sendCancelRequest,
    isPending: sendingCancel,
    isSuccess: cancelAsked,
    isError: cancelFailed,
    reset: resetCancel,
  } = useCreateCancelRequestMutation(client);

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

  /**
   * 늦은 수락만 시트를 닫는다. 통신이 끊긴 것은 다시 누를 자리가 시트 안이라 열어 둔다.
   */
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
      const date = request.slots.days.work_date;

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
          request.request_candidates.some(
            (candidate) =>
              candidate.profile_id === myProfileId &&
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
    (request) => request.assignment_id === myShift?.id,
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

  /**
   * 취소 요청이 갔으면 겹째로 닫는다 — 명단 얼굴로 돌아오지 않는다. 보낸 뒤 그 배정에
   * 남는 것은 「취소 요청 중」 배지뿐이고 다음 진입에서 최신 상태를 그린다
   * (schedule-worker.md의 「보낸 뒤」).
   */
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
            closedAt: openRequest.closed_at,
            expiresAt: openRequest.expires_at,
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
