import { useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, ScrollView, View } from "react-native";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Checkbox";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import type { ScheduleDay } from "@/entities/schedule/dals/get-month-schedule";
import { useMyProfile } from "@/features/profile/model/useMyProfile";
import { useMonthSchedule } from "@/features/schedule/model/useMonthSchedule";
import { useMonthWindow } from "@/features/schedule/model/useMonthWindow";
import { useMyAvailability } from "@/features/schedule/model/useMyAvailability";
import { useSubmitAvailability } from "@/features/schedule/model/useSubmitAvailability";
import {
  myAssignmentOf,
  spellWorkDate,
} from "@/screens/schedule-worker/model/agenda-row";
import { calendarDayState } from "@/screens/schedule-worker/model/calendar-day-state";
import {
  canShowShiftActions,
  daySheetSubtitle,
  rosterHeadcount,
  rosterOfDay,
} from "@/screens/schedule-worker/model/day-sheet";
import {
  kstToday,
  monthState,
  shiftMonth,
  spellDeadline,
  spellMonth,
} from "@/screens/schedule-worker/model/month-state";
import { toggleSelectedDate } from "@/screens/schedule-worker/model/submission-selection";
import { DaySheet } from "@/screens/schedule-worker/ui/DaySheet";
import { MonthCalendar } from "@/screens/schedule-worker/ui/MonthCalendar";
import {
  ScheduleAgenda,
  type AgendaEntry,
} from "@/screens/schedule-worker/ui/ScheduleAgenda";

/**
 * 근무자가 보는 근무표다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-worker.md`고 완료 조건은
 * `docs/2-design/spec/schedule-worker.md`다.
 *
 * **한 화면이 달의 상태를 탄다.** 확정된 달은 근무표고 확정 전 달은 같은 자리가 제출 모드다 —
 * 별도 제출 화면이 없다. 무엇을 그릴지는 `monthState`가 가른다.
 *
 * **고른 날짜는 아직 안 보낸 로컬 상태다.** 누르면 화면이 바로 칠하고 서버에는 「보내기」가 한
 * 번 보낸다([근무 신청 내기](../../../../docs/2-design/modules/schedule/design.md#근무-신청-내기)).
 * 낙관적 업데이트가 아니라서 보내기가 실패해도 고른 날이 그대로 남는다.
 *
 * **아직 안 채운 넷.** 인증 상태 열과 현황 줄은 `check_ins` 표가 서는 attendance task 뒤에
 * 차고, 근무 취소·교대 요청 시트는 각각 다른 task가 낸다. 달 고르기 시트와 요청 온 날의 도는
 * 점선도 아직이다(`docs/3-build/plans/schedule-worker.md`의 AC-09).
 */

const SKELETON_ROWS = [0, 1, 2];

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

  const { data: profile } = useMyProfile(supabase, me);
  const { data: monthWindow } = useMonthWindow(supabase, month);
  const { data: days } = useMonthSchedule(supabase, month);
  const { data: myDates } = useMyAvailability(supabase, month);

  const {
    mutate: send,
    isPending: sending,
    isSuccess: sent,
    isError: sendFailed,
    reset: resetSend,
  } = useSubmitAvailability(supabase);

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
    setExpanded([]);
  };

  const openDay = dayOf.get(openDate ?? "") ?? null;
  const openRoster = openDay === null ? [] : rosterOfDay(openDay);
  const openMine =
    openDay === null ? null : myAssignmentOf(openDay.assignments, myProfileId);

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
      hasIncomingRequest: false,
      showMineOnly,
    });
  };

  const pressDay = (date: string) =>
    collecting
      ? setSelected(toggleSelectedDate(selected, date))
      : setOpenDate(date);

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
        right={<BellIcon onPress={() => router.push("/notifications")} />}
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
                    onCancelShift={() => undefined}
                    onRequestSwap={() => undefined}
                  />
                </Card>
              ) : (
                calendar
              )}

              <Text size="xs" tone="subtle">
                점이 내 근무예요
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

      {openDay !== null ? (
        <SheetLayer onDismiss={() => setOpenDate(null)}>
          <DaySheet
            title={spellWorkDate(openDay.work_date)}
            subtitle={daySheetSubtitle(
              openDay.starts_at,
              openDay.ends_at,
              rosterHeadcount(openRoster),
            )}
            rows={openRoster}
            myProfileId={myProfileId}
            showActions={canShowShiftActions({
              isMyAssignment: openMine !== null,
              workDate: openDay.work_date,
              today,
            })}
            onCancelShift={() => undefined}
            onRequestSwap={() => undefined}
          />
        </SheetLayer>
      ) : null}

      {toast ? (
        <FloatingToast kind="success" message={toast} onDone={hideToast} />
      ) : null}
    </Screen>
  );
}
