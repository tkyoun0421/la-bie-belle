import { usePathname, useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, ScrollView, View } from "react-native";
import { DomainError } from "@/shared/api/errors";
import { getCurrentUser } from "@/shared/lib/getCurrentUser";
import { nowWithOffset } from "@/shared/lib/serverClock";
import { serverClockStore } from "@/shared/lib/serverClockStore";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Checkbox";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import type { ScheduleDay } from "@/entities/schedule/api/getMonthSchedule.api";
import type { SlotRequest } from "@/entities/schedule/api/getSlotRequests.api";
import { useUnreadCount } from "@/features/notification/model/useUnreadCount";
import { useMyProfile } from "@/features/profile/model/useMyProfile";
import { useCreateCancelRequest } from "@/features/schedule/model/useCreateCancelRequest";
import { useMonthSchedule } from "@/features/schedule/model/useMonthSchedule";
import { useMonthWindow } from "@/features/schedule/model/useMonthWindow";
import { useMyAvailability } from "@/features/schedule/model/useMyAvailability";
import { usePendingApprovals } from "@/features/schedule/model/usePendingApprovals";
import { useRespondRequest } from "@/features/schedule/model/useRespondRequest";
import { useSlotRequests } from "@/features/schedule/model/useSlotRequests";
import { useSubmitAvailability } from "@/features/schedule/model/useSubmitAvailability";
import {
  myAssignmentOf,
  spellWorkDate,
} from "@/screens/scheduleWorker/model/agendaRow";
import { calendarDayState } from "@/screens/scheduleWorker/model/calendarDayState";
import { cancelRequestBadge } from "@/screens/scheduleWorker/model/cancelRequestSheet";
import {
  canShowShiftActions,
  daySheetSubtitle,
  rosterHeadcount,
  rosterOfDay,
} from "@/screens/scheduleWorker/model/daySheet";
import { hasIncomingRequest } from "@/screens/scheduleWorker/model/incomingRequest";
import {
  kstToday,
  monthState,
  shiftMonth,
  spellDeadline,
  spellMonth,
} from "@/screens/scheduleWorker/model/monthState";
import { requestSheetState } from "@/screens/scheduleWorker/model/requestSheet";
import { toggleSelectedDate } from "@/screens/scheduleWorker/model/submissionSelection";
import { CancelShiftSheet } from "@/screens/scheduleWorker/ui/CancelShiftSheet";
import { DaySheet } from "@/screens/scheduleWorker/ui/DaySheet";
import { RequestSheet } from "@/screens/scheduleWorker/ui/RequestSheet";
import {
  ScheduleAgenda,
  type AgendaEntry,
} from "@/screens/scheduleWorker/ui/ScheduleAgenda";

/**
 * 근무자가 보는 근무표다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleWorker.md`고 완료 조건은
 * `docs/2-design/spec/schedule-worker.md`다.
 *
 * **한 화면이 달의 상태를 탄다.** 확정된 달은 근무표고 확정 전 달은 같은 자리가 제출 모드다 —
 * 별도 제출 화면이 없다. 무엇을 그릴지는 `monthState`가 가른다.
 *
 * **고른 날짜는 아직 안 보낸 로컬 상태다.** 누르면 화면이 바로 칠하고 서버에는 「보내기」가 한
 * 번 보낸다([근무 신청 내기](../../../../docs/2-design/modules/schedule/design.md#근무-신청-내기)).
 * 낙관적 업데이트가 아니라서 보내기가 실패해도 고른 날이 그대로 남는다.
 *
 * **날짜 하나에 문이 둘이다.** 그 날 내게 온 근무 요청이 살아 있으면 요청 시트가 열리고
 * 아니면 명단 시트다 — 알림도 달력 칸도 같은 `?date=`로 들어오는데(「목적과 진입」) 요청에
 * 답하는 것이 그 자리에서 할 일이라 명단을 한 번 더 지나게 하지 않는다.
 *
 * **늦은 수락은 오류 블록이 아니다.** 시트를 닫고 토스트로 말한 뒤 달력 아래 줄에 그 사건을
 * 남긴다 — 되살아나지 않는 요청이라 시트에 붙잡아 둘 일이 없다(「실패와 경합」).
 *
 * **아직 안 채운 셋.** 인증 상태 열과 현황 줄은 `check_ins` 표가 서는 attendance task 뒤에
 * 차고, 교대 요청 시트는 swap task가 낸다. 달 고르기 시트도 아직이다
 * (`docs/3-build/plans/schedule-worker.md`의 AC-09).
 */

const SKELETON_ROWS = [0, 1, 2];

/** 「10월 17일」 — 달력 아래 줄의 사건 문구는 요일을 안 붙인다. */
function bareDate(workDate: string): string {
  const [, month, day] = workDate.split("-").map(Number);

  return `${month}월 ${day}일`;
}

/** 요청 시트 부제 — 「10월 17일(토) · 안내 · 10:00 – 18:00」. */
function requestSubtitle(request: SlotRequest): string {
  const { positions, days } = request.slots;

  return `${spellWorkDate(days.work_date)} · ${positions[0] ?? ""} · ${days.starts_at.slice(0, 5)} – ${days.ends_at.slice(0, 5)}`;
}

/** 늦은 수락이 달력 아래 줄에 남기는 사건 문구다. */
function claimedLine(request: SlotRequest): string {
  return `${bareDate(request.slots.days.work_date)} ${request.slots.positions[0] ?? ""} 자리는 다른 분이 맡았어요`;
}

const VIEW_OPTIONS = [
  {
    value: "calendar",
    icon: CalendarDays,
    accessibilityLabel: "달력 순",
  },
  { value: "position", icon: List, accessibilityLabel: "포지션 순" },
];

export type ScheduleWorkerScreenProps = {
  month?: string;
  date?: string;
};

export function ScheduleWorkerScreen({
  month: monthParam,
  date: dateParam,
}: ScheduleWorkerScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useUnreadCount(supabase);
  const today = kstToday();

  const [me, setMe] = useState<string | null>(null);
  const [month, setMonth] = useState(
    monthParam ?? dateParam?.slice(0, 7) ?? today.slice(0, 7),
  );
  const [view, setView] = useState("calendar");
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [openDate, setOpenDate] = useState<string | null>(dateParam ?? null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [claimed, setClaimed] = useState<string | null>(null);
  const [answering, setAnswering] = useState<SlotRequest | null>(null);

  const { data: profile } = useMyProfile(supabase, me);
  const { data: monthWindow } = useMonthWindow(supabase, month);
  const { data: days } = useMonthSchedule(supabase, month);
  const { data: myDates } = useMyAvailability(supabase, month);
  const { data: slotRequests } = useSlotRequests(supabase, month);
  const { data: myCancelRequests } = usePendingApprovals(supabase);
  const clockOffset = serverClockStore((at) => at.offset);

  const {
    mutate: send,
    isPending: sending,
    isSuccess: sent,
    isError: sendFailed,
    reset: resetSend,
  } = useSubmitAvailability(supabase);

  const {
    mutate: answer,
    isPending: sendingAnswer,
    isSuccess: answered,
    isError: answerFailed,
    error: answerError,
    reset: resetAnswer,
  } = useRespondRequest(supabase);

  const {
    mutate: askCancel,
    isPending: sendingCancel,
    isSuccess: cancelAsked,
    isError: cancelFailed,
    reset: resetCancel,
  } = useCreateCancelRequest(supabase);

  const myProfileId = profile?.id ?? null;

  useEffect(() => {
    void getCurrentUser(supabase).then((user) => setMe(user?.id ?? null));
  }, []);

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

    setToast(`${Number(month.slice(5))}월 근무 신청을 보냈어요`);
    resetSend();
  }, [sent, month, resetSend]);

  useEffect(() => {
    if (!sendFailed) {
      return;
    }

    setToast("보내지 못했어요. 다시 시도해주세요");
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

  /**
   * 늦은 수락만 시트를 닫는다. 통신이 끊긴 것은 다시 누를 자리가 시트 안이라 열어 둔다.
   */
  useEffect(() => {
    if (
      !answerFailed ||
      !(answerError instanceof DomainError) ||
      answerError.code !== "slot_full"
    ) {
      return;
    }

    setClaimed(answering === null ? null : claimedLine(answering));
    setAnswering(null);
    setOpenDate(null);
    setToast("자리가 찼어요");
    resetAnswer();
  }, [answerFailed, answerError, answering, resetAnswer]);

  useEffect(() => {
    if (!cancelAsked) {
      return;
    }

    setCancelling(false);
    resetCancel();
  }, [cancelAsked, resetCancel]);

  useEffect(() => {
    if (openDate === null) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setOpenDate(null);

        return true;
      },
    );

    return () => subscription.remove();
  }, [openDate]);

  const hideToast = useCallback(() => setToast(null), []);

  const dayOf = useMemo(() => {
    const byDate = new Map<string, ScheduleDay>();

    for (const day of days ?? []) {
      byDate.set(day.work_date, day);
    }

    return byDate;
  }, [days]);

  const state = monthState({ schedule: monthWindow ?? null, today });
  const loading = monthWindow === undefined || days === undefined;
  const collecting = state === "collecting";
  const confirmed = state === "confirmed";
  const deadline = monthWindow?.applicationDeadline ?? null;

  const goMonth = (step: number) => {
    setMonth(shiftMonth(month, step));
    setOpenDate(null);
    setCancelling(false);
    setClaimed(null);
    setExpanded([]);
  };

  const requestsOf = useMemo(() => {
    const byDate = new Map<string, SlotRequest[]>();

    for (const request of slotRequests ?? []) {
      const date = request.slots.days.work_date;

      byDate.set(date, [...(byDate.get(date) ?? []), request]);
    }

    return byDate;
  }, [slotRequests]);

  const serverNowMs = nowWithOffset(Date.now(), clockOffset);

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

  const myBadge = cancelRequestBadge(cancelAsking) ?? undefined;

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

  const cellStateOf = (date: string) => {
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
  };

  const anyIncoming = [...requestsOf.keys()].some((date) =>
    hasIncomingRequest(requestsOf.get(date) ?? [], myProfileId),
  );

  const calendarNote =
    claimed ??
    (anyIncoming
      ? "점이 내 근무, 도는 점선이 근무 요청이에요"
      : "점이 내 근무예요");

  const pressDay = (date: string) => {
    if (collecting) {
      setSelected(toggleSelectedDate(selected, date));
      return;
    }

    setCancelling(false);
    setOpenDate(date);
  };

  const calendar = (
    <Card>
      <MonthCalendar
        month={month}
        stateOf={cellStateOf}
        isToday={(date) => date === today}
        canPress={(date) => collecting || dayOf.has(date)}
        onPressDay={confirmed || collecting ? pressDay : undefined}
      />
    </Card>
  );

  return (
    <Screen>
      <AppBar
        title={
          <View className="flex-row items-center gap-1">
            <Button
              variant="ghost"
              size="compact"
              square
              testID="schedule-month-prev"
              onPress={() => goMonth(-1)}
            >
              <Icon icon={ChevronLeft} />
            </Button>
            <Text size="lg" weight="semibold">
              {spellMonth(month)}
            </Text>
            <Button
              variant="ghost"
              size="compact"
              square
              testID="schedule-month-next"
              onPress={() => goMonth(1)}
            >
              <Icon icon={ChevronRight} />
            </Button>
          </View>
        }
        right={
          <BellIcon
            testID="bell-icon"
            unread={(unreadCount.data ?? 0) > 0}
            onPress={() => router.push(`/notifications?from=${pathname}`)}
          />
        }
      />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
          {loading ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : confirmed ? (
            <>
              <View className="flex-row items-center justify-between gap-3 py-1">
                <Segment
                  options={VIEW_OPTIONS}
                  value={view}
                  onChange={setView}
                  className="flex-1"
                />
                <Checkbox
                  label="내 근무만"
                  checked={showMineOnly}
                  onCheckedChange={setShowMineOnly}
                />
              </View>

              {view === "position" ? (
                <Card className="py-0">
                  <ScheduleAgenda
                    entries={agendaEntries}
                    expanded={expanded}
                    myProfileId={myProfileId}
                    onToggle={(workDate) =>
                      setExpanded(toggleSelectedDate(expanded, workDate))
                    }
                    onCancelShift={(workDate) => {
                      setOpenDate(workDate);
                      setCancelling(true);
                    }}
                    onRequestSwap={() => undefined}
                  />
                </Card>
              ) : (
                calendar
              )}

              <Text size="xs" tone="subtle">
                {calendarNote}
              </Text>
            </>
          ) : (
            <>
              {deadline === null ? null : (
                <Text size="xs" tone="subtle" numeric className="py-1">
                  {spellDeadline(deadline, today)}
                </Text>
              )}

              {calendar}

              {state === "not_created" ? (
                <Text size="sm" tone="muted">
                  {`아직 ${Number(month.slice(5))}월 근무 신청을 받지 않아요. 열리면 알려드릴게요`}
                </Text>
              ) : null}

              {state === "closed_awaiting_confirmation" ? (
                <Text size="sm" tone="muted">
                  근무표를 만들고 있어요. 확정되면 여기에 보여요
                </Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {collecting ? (
        <BottomCTA>
          <Button
            variant="primary"
            loading={sending}
            onPress={() => send({ month, dates: selected })}
          >
            보내기
          </Button>
        </BottomCTA>
      ) : null}

      {openRequest !== null ? (
        <SheetLayer
          onDismiss={() => {
            setOpenDate(null);
            resetAnswer();
          }}
        >
          <RequestSheet
            subtitle={requestSubtitle(openRequest)}
            state={requestSheetState({
              closedAt: openRequest.closed_at,
              expiresAt: openRequest.expires_at,
              serverNowMs,
            })}
            sending={sendingAnswer}
            failed={answerFailed}
            onDecline={() => {
              setAnswering(openRequest);
              answer({ requestId: openRequest.id, answer: "decline" });
            }}
            onAccept={() => {
              setAnswering(openRequest);
              answer({ requestId: openRequest.id, answer: "accept" });
            }}
          />
        </SheetLayer>
      ) : openDay !== null ? (
        <SheetLayer
          onDismiss={() => {
            setOpenDate(null);
            setCancelling(false);
            resetCancel();
          }}
        >
          {cancelling && myShift !== null ? (
            <CancelShiftSheet
              title={`근무 취소 · ${spellWorkDate(openDay.work_date)} ${myShift.position}`}
              sending={sendingCancel}
              failed={cancelFailed}
              onSend={(reason) =>
                askCancel({ assignmentId: myShift.id, reason })
              }
            />
          ) : (
            <DaySheet
              title={spellWorkDate(openDay.work_date)}
              subtitle={daySheetSubtitle(
                openDay.starts_at,
                openDay.ends_at,
                rosterHeadcount(openRoster),
              )}
              rows={openRoster}
              myProfileId={myProfileId}
              myBadge={myBadge}
              showActions={canShowShiftActions({
                isMyAssignment: openMine !== null,
                workDate: openDay.work_date,
                today,
              })}
              actionsEnabled={canShowShiftActions({
                isMyAssignment: openMine !== null,
                workDate: openDay.work_date,
                today,
                hasActiveCancelRequest: cancelAsking,
              })}
              onCancelShift={() => setCancelling(true)}
              onRequestSwap={() => undefined}
            />
          )}
        </SheetLayer>
      ) : null}

      {toast ? (
        <FloatingToast kind="success" message={toast} onDone={hideToast} />
      ) : null}
    </Screen>
  );
}
