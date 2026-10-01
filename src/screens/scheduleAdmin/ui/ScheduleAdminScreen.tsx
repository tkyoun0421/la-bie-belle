import { useRouter } from "expo-router";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Badge } from "@/shared/ui/Badge";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { useMonthAvailabilitiesQuery } from "@/entities/availability/hooks/useMonthAvailabilitiesQuery";
import { serverClockStore } from "@/entities/clock/model/clock.store";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { useMembersQuery } from "@/entities/member/hooks/useMembersQuery";
import { useQualificationsQuery } from "@/entities/member/hooks/useQualificationsQuery";
import { usePayrollMonthsQuery } from "@/entities/payroll/hooks/usePayrollMonthsQuery";
import { useAllRehearsalsQuery } from "@/entities/rehearsal/hooks/useAllRehearsalsQuery";
import { liveAssignmentCount } from "@/entities/schedule/api/getMonthSchedule.api";
import { useMonthScheduleQuery } from "@/entities/schedule/hooks/useMonthScheduleQuery";
import { useMonthWindowQuery } from "@/entities/schedule/hooks/useMonthWindowQuery";
import { useOpenSlotsQuery } from "@/entities/schedule/hooks/useOpenSlotsQuery";
import { useSlotRequestsQuery } from "@/entities/workRequest/hooks/useSlotRequestsQuery";
import { useSetAdjustmentMutation } from "@/features/adjustment/hooks/useSetAdjustmentMutation";
import { useSetApplicationDeadlineMutation } from "@/features/availabilitySubmit/hooks/useSetApplicationDeadlineMutation";
import { DeadlineSheet } from "@/features/availabilitySubmit/ui/DeadlineSheet";
import { useSetHolidayMutation } from "@/features/holiday/hooks/useSetHolidayMutation";
import { useGrantPositionMutation } from "@/features/qualificationGrant/hooks/useGrantPositionMutation";
import type { AddAssignmentInput } from "@/features/scheduleAssign/api/addAssignment.api";
import { useAddAssignmentMutation } from "@/features/scheduleAssign/hooks/useAddAssignmentMutation";
import { useRemoveAssignmentMutation } from "@/features/scheduleAssign/hooks/useRemoveAssignmentMutation";
import { useConfirmScheduleMutation } from "@/features/scheduleConfirm/hooks/useConfirmScheduleMutation";
import { useForceChangeMutation } from "@/features/scheduleConfirm/hooks/useForceChangeMutation";
import { useCloseDayMutation } from "@/features/scheduleDay/hooks/useCloseDayMutation";
import { useCreateScheduleMutation } from "@/features/scheduleDay/hooks/useCreateScheduleMutation";
import { useOpenDayMutation } from "@/features/scheduleDay/hooks/useOpenDayMutation";
import { useSetDayHoursMutation } from "@/features/scheduleDay/hooks/useSetDayHoursMutation";
import { useAddSlotMutation } from "@/features/scheduleSlot/hooks/useAddSlotMutation";
import { useMergeSlotsMutation } from "@/features/scheduleSlot/hooks/useMergeSlotsMutation";
import { useRemoveSlotMutation } from "@/features/scheduleSlot/hooks/useRemoveSlotMutation";
import { useSplitSlotMutation } from "@/features/scheduleSlot/hooks/useSplitSlotMutation";
import { useSendWorkRequestMutation } from "@/features/workRequest/hooks/useSendWorkRequestMutation";
import {
  adminCalendarDayState,
  confirmedVacancyCount,
} from "@/screens/scheduleAdmin/model/adminCalendarDayState.policy";
import {
  confirmAffordance,
  confirmUnlockLine,
} from "@/screens/scheduleAdmin/model/confirmAffordance.policy";
import { dayConfirmGate } from "@/screens/scheduleAdmin/model/confirmGate.policy";
import {
  isMonthFullyPast,
  shiftMonth,
} from "@/screens/scheduleAdmin/model/monthEmptyState.policy";
import {
  isSelectableForOpening,
  openDaysButtonLabel,
  openDaysFailureToast,
} from "@/screens/scheduleAdmin/model/openModeSelection.policy";
import { CloseDayWarningSheet } from "@/screens/scheduleAdmin/ui/CloseDayWarningSheet";
import { ConfirmSheet } from "@/screens/scheduleAdmin/ui/ConfirmSheet";
import { CreateScheduleSheet } from "@/screens/scheduleAdmin/ui/CreateScheduleSheet";
import { DayDetail } from "@/screens/scheduleAdmin/ui/DayDetail";
import { DayHoursSheet } from "@/screens/scheduleAdmin/ui/DayHoursSheet";
import { deadlineLine } from "@/screens/scheduleAdmin/utils/deadlineLine.utils";
import {
  confirmedLine,
  formatMonthName,
  formatMonthTitle,
  kstDateOf,
} from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";
import { countOpenSlotsByDate } from "@/screens/scheduleAdmin/utils/groupOpenSlots.utils";

/**
 * 관리자가 근무표를 짜는 화면이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`고 완료 조건은
 * `docs/2-design/spec/schedule-admin.md`다.
 *
 * **한 라우트가 달력과 날 상세를 둘 다 든다.** `?date=`가 있으면 그 날의 상세고 없으면
 * 달력이다 — 알림과 관리자 홈이 날짜로 바로 들어오는 자리라 문이 하나여야 한다
 * (`docs/2-design/system/navigation.md`의 「경로」).
 *
 * **달 근무표가 없으면 달력 대신 빈 상태가 선다.** 만들기는 별도 화면이 아니다.
 *
 * **날 열기는 같은 달력의 모드다.** 닫힌 날만 골라지고, 여러 날 중 일부만 실패하면 나머지는
 * 열린 채로 모드가 안 풀린다 — 실패한 날을 다시 고를 자리가 필요해서다.
 *
 * **날 상세가 쓰는 것을 이 껍데기가 모아 넘긴다.** 자리·배정·명단·자격을 읽고 쓰기 여덟을
 * 거는 자리가 여기고, 어느 시트를 세울지는 `DayDetail`이 정한다 — 달력과 날 상세가 한
 * 라우트라 훅이 두 갈래로 갈리지 않는다.
 *
 * **날 상세가 읽는 키가 넷이다.** 자리·배정의 `['schedule']`에 임시공휴일과 조정을 실은
 * `['payroll', 'YYYY-MM']`과 그달 전원 리허설 `['rehearsal', 'YYYY-MM', 'all']`이 붙는다 —
 * 조정 시트가 줄마다 세는 최종 시간이 셋을 다 쓴다(plan payroll-adjust AC-05).
 *
 * **`?from=`은 앱바 뒤로가 어디로 가는지와 도착 토스트를 정한다.** 승인할 일에서 근무 취소를
 * 승인하면 그 자리를 채우러 여기로 오는데, 「근무를 취소했어요」는 그 판정이 끝난 뒤에 뜰
 * 문장이라 떠나는 화면이 아니라 닿는 화면이 띄운다
 * (`docs/2-design/system/screens/approvals.md`의 「근무 취소 승인」,
 * [navigation.md](../../../../docs/2-design/system/navigation.md#경로)).
 *
 * **알림 목록에서 와도 같은 자리다.** `?from=notifications`면 뒤로가 그 목록으로 간다
 * ([navigation.md 「뒤로」](../../../../docs/2-design/system/navigation.md#뒤로)) — 토스트는
 * 없다. 알림은 일어난 일을 알리는 것이지 방금 누른 판정의 결과가 아니다.
 */

/**
 * 보내기가 끝나면 시트를 닫고 훅을 비운다. 안 비우면 같은 시트를 다시 열었을 때 지난 성공이
 * 그대로 남아 열자마자 닫힌다.
 */
function useCloseSheetOnSuccess(
  succeeded: boolean,
  reset: () => void,
  leave: () => void,
) {
  useEffect(() => {
    if (succeeded) {
      leave();
      reset();
    }
  }, [succeeded, reset, leave]);
}

const EMPTY_ICON_SIZE = 44;

const SKELETON_ROWS = [0, 1, 2];

const APPROVALS_ORIGIN = "approvals";

const NOTIFICATIONS_ORIGIN = "notifications";

const CANCELED_TOAST = "근무를 취소했어요";

export type ScheduleAdminScreenProps = {
  month?: string;
  date?: string;
  from?: string;
};

export function ScheduleAdminScreen({
  month: monthParam,
  date: dateParam,
  from,
}: ScheduleAdminScreenProps) {
  const router = useRouter();
  const now = new Date().toISOString();
  const today = kstDateOf(now);

  const [month, setMonth] = useState(
    monthParam ?? dateParam?.slice(0, 7) ?? today.slice(0, 7),
  );
  const [openDate, setOpenDate] = useState<string | null>(dateParam ?? null);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [sheet, setSheet] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: schedule, isLoading: loadingWindow } = useMonthWindowQuery(
    supabase,
    month,
  );
  const { data: days, refetch: reloadDays } = useMonthScheduleQuery(
    supabase,
    month,
  );
  const { data: openSlots } = useOpenSlotsQuery(supabase, month);
  const { data: availabilities } = useMonthAvailabilitiesQuery(supabase, month);
  const { data: activeMembers } = useMembersQuery(supabase, "active");
  const { data: qualifications } = useQualificationsQuery(supabase);
  const { data: slotRequests } = useSlotRequestsQuery(supabase, month);
  const { data: payroll } = usePayrollMonthsQuery(supabase, [month]);
  const { data: rehearsals } = useAllRehearsalsQuery(supabase, month);
  const clockOffset = serverClockStore((at) => at.offset);

  const create = useCreateScheduleMutation(supabase);
  const changeDeadline = useSetApplicationDeadlineMutation(supabase);
  const open = useOpenDayMutation(supabase);
  const close = useCloseDayMutation(supabase);
  const setHours = useSetDayHoursMutation(supabase);
  const confirm = useConfirmScheduleMutation(supabase);
  const addSlot = useAddSlotMutation(supabase);
  const removeSlot = useRemoveSlotMutation(supabase);
  const mergeSlots = useMergeSlotsMutation(supabase);
  const splitSlot = useSplitSlotMutation(supabase);
  const addAssignment = useAddAssignmentMutation(supabase);
  const removeAssignment = useRemoveAssignmentMutation(supabase);
  const forceChange = useForceChangeMutation(supabase);
  const grantPosition = useGrantPositionMutation(supabase);
  const sendWorkRequest = useSendWorkRequestMutation(supabase);
  const setHoliday = useSetHolidayMutation(supabase);
  const setAdjustment = useSetAdjustmentMutation(supabase);

  /**
   * 「자격도 주기」는 한 트랜잭션이 아니라 두 호출이다. 앞이 성공하고 뒤가 실패하면 자격만
   * 남는데, 자격은 사람의 속성이라 그 상태가 틀린 것이 아니다(plan AC-05).
   */
  const grantAndAssign = useCallback(
    async (input: AddAssignmentInput, position: string) => {
      await grantPosition.mutateAsync({
        profileId: input.profileId,
        position,
      });
      addAssignment.mutate(input);
    },
    [addAssignment, grantPosition],
  );

  const closeSheet = useCallback(() => setSheet(null), []);
  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (from === APPROVALS_ORIGIN) {
      setToast(CANCELED_TOAST);
    }
  }, [from]);

  useEffect(() => {
    const asked = monthParam ?? dateParam?.slice(0, 7);

    if (asked !== undefined) {
      setMonth(asked);
    }
    setOpenDate(dateParam ?? null);
  }, [monthParam, dateParam]);

  useCloseSheetOnSuccess(create.isSuccess, create.reset, closeSheet);
  useCloseSheetOnSuccess(
    changeDeadline.isSuccess,
    changeDeadline.reset,
    closeSheet,
  );
  useCloseSheetOnSuccess(setHours.isSuccess, setHours.reset, closeSheet);

  const leaveDay = useCallback(() => {
    setSheet(null);
    setOpenDate(null);
  }, []);

  useCloseSheetOnSuccess(close.isSuccess, close.reset, leaveDay);

  const dayList = days ?? [];
  const slotRows = openSlots ?? [];
  const applications = availabilities ?? [];

  const dayOf = new Map(dayList.map((day) => [day.work_date, day]));
  const vacancyOf = countOpenSlotsByDate(slotRows);

  const applicationCountOf = new Map<string, number>();
  const applicationNamesOf = new Map<string, string[]>();
  const applicationIdsOf = new Map<string, string[]>();

  for (const row of applications) {
    applicationCountOf.set(
      row.work_date,
      (applicationCountOf.get(row.work_date) ?? 0) + 1,
    );

    const names = applicationNamesOf.get(row.work_date) ?? [];

    names.push(row.profiles?.display_name ?? "");
    applicationNamesOf.set(row.work_date, names);

    const ids = applicationIdsOf.get(row.work_date) ?? [];

    ids.push(row.profile_id);
    applicationIdsOf.set(row.work_date, ids);
  }

  const confirmed = schedule?.confirmedAt != null;
  const deadline = schedule?.applicationDeadline ?? null;
  const monthName = formatMonthName(month);

  const affordance = confirmAffordance({
    applicationDeadline: deadline,
    confirmedAt: schedule?.confirmedAt ?? null,
    now,
  });

  const notifiedCount = new Set(
    dayList.flatMap((day) =>
      day.assignments
        .filter((assignment) => assignment.ended_at === null)
        .map((assignment) => assignment.profile_id),
    ),
  ).size;

  const goMonth = (step: number) => {
    setMonth(shiftMonth(month, step));
    setOpenDate(null);
    setPicking(false);
    setPicked([]);
  };

  const togglePicked = (date: string) =>
    setPicked(
      picked.includes(date)
        ? picked.filter((one) => one !== date)
        : [...picked, date],
    );

  const openPickedDays = async () => {
    const failed: string[] = [];

    for (const date of [...picked].sort()) {
      try {
        await open.mutateAsync({ workDate: date });
      } catch {
        failed.push(date);
      }
    }

    const message = openDaysFailureToast(failed);

    setPicked(failed);
    setToast(message);

    if (message === null) {
      setPicking(false);
    }
  };

  const day = openDate === null ? null : (dayOf.get(openDate) ?? null);

  if (day !== null) {
    const assignmentCount = liveAssignmentCount(day);

    return (
      <Screen>
        <DayDetail
          dayId={day.id}
          workDate={day.work_date}
          startsAt={day.starts_at}
          endsAt={day.ends_at}
          slots={day.slots}
          assignments={day.assignments}
          applicationNames={applicationNamesOf.get(day.work_date) ?? []}
          appliedProfileIds={applicationIdsOf.get(day.work_date) ?? []}
          members={activeMembers ?? []}
          qualifications={qualifications ?? []}
          slotRequests={(slotRequests ?? []).filter(
            (request) => request.slots.days.work_date === day.work_date,
          )}
          holidays={(payroll?.holidays ?? []).filter(
            (row) => row.holiday_date === day.work_date,
          )}
          adjustments={(payroll?.adjustments ?? []).filter(
            (row) => row.day_id === day.id,
          )}
          rehearsals={(rehearsals ?? []).filter(
            (row) => row.work_date === day.work_date,
          )}
          serverNowMs={nowWithOffset(Date.parse(now), clockOffset)}
          gate={dayConfirmGate({
            openedAt: day.opened_at,
            confirmedAt: schedule?.confirmedAt ?? null,
          })}
          isConfirmed={confirmed}
          saving={
            addAssignment.isPending ||
            removeAssignment.isPending ||
            forceChange.isPending ||
            removeSlot.isPending ||
            sendWorkRequest.isPending
          }
          adjusting={setAdjustment.isPending}
          adjusted={setAdjustment.isSuccess}
          adjustError={setAdjustment.error}
          onBack={() => {
            if (from === APPROVALS_ORIGIN) {
              router.replace("/admin/approvals");
              return;
            }

            if (from === NOTIFICATIONS_ORIGIN) {
              router.replace("/notifications");
              return;
            }

            setOpenDate(null);
          }}
          onPressHours={() => setSheet("hours")}
          onCloseDay={() =>
            assignmentCount === 0
              ? close.mutate({ workDate: day.work_date })
              : setSheet("close")
          }
          onAddSlot={(id, position) => addSlot.mutate({ dayId: id, position })}
          onRemoveSlot={(slotId) => removeSlot.mutate({ slotId })}
          onMergeSlots={(id, from, to) =>
            mergeSlots.mutate({ dayId: id, from, to })
          }
          onSplitSlot={(slotId) => splitSlot.mutate({ slotId })}
          onAddAssignment={(input) => addAssignment.mutate(input)}
          onGrantAndAssign={(input, position) =>
            void grantAndAssign(input, position)
          }
          onRemoveAssignment={(assignmentId) =>
            removeAssignment.mutate({ assignmentId })
          }
          onForceChange={(assignmentId, profileId) =>
            forceChange.mutate({ assignmentId, profileId })
          }
          onSendWorkRequest={(slotId, profileIds) =>
            sendWorkRequest.mutate({ slotId, profileIds })
          }
          onSetHoliday={(on) => setHoliday.mutate({ date: day.work_date, on })}
          onSetAdjustment={({ profileId, minutes, reason }) =>
            setAdjustment.mutate({
              dayId: day.id,
              profileId,
              minutes,
              reason,
            })
          }
          onAdjustSettled={setAdjustment.reset}
          onReloadDay={reloadDays}
        />

        {sheet === "hours" ? (
          <SheetLayer onDismiss={closeSheet}>
            <DayHoursSheet
              starts={day.starts_at.slice(0, 5)}
              ends={day.ends_at.slice(0, 5)}
              saving={setHours.isPending}
              failed={setHours.isError}
              onClose={closeSheet}
              onSave={({ starts, ends }) =>
                setHours.mutate({ workDate: day.work_date, starts, ends })
              }
            />
          </SheetLayer>
        ) : null}

        {sheet === "close" ? (
          <SheetLayer onDismiss={closeSheet}>
            <CloseDayWarningSheet
              workDate={day.work_date}
              assignmentCount={assignmentCount}
              closing={close.isPending}
              onCancel={closeSheet}
              onConfirm={() => close.mutate({ workDate: day.work_date })}
            />
          </SheetLayer>
        ) : null}

        {toast ? (
          <FloatingToast kind="success" message={toast} onDone={hideToast} />
        ) : null}
      </Screen>
    );
  }

  const calendar = (
    <Card>
      <MonthCalendar
        month={month}
        isToday={(date) => date === today}
        stateOf={(date) =>
          adminCalendarDayState({
            isOpen: dayOf.has(date),
            isPicked: picking && picked.includes(date),
          })
        }
        canPress={(date) =>
          picking
            ? isSelectableForOpening({
                workDate: date,
                isOpen: dayOf.has(date),
                now,
              })
            : dayOf.has(date)
        }
        onPressDay={picking ? togglePicked : setOpenDate}
        applicationCountOf={(date) =>
          confirmed ? 0 : (applicationCountOf.get(date) ?? 0)
        }
        vacancyCountOf={(date) =>
          confirmedVacancyCount({
            isConfirmed: confirmed,
            openSlotCount: vacancyOf[date] ?? 0,
          })
        }
      />
    </Card>
  );

  return (
    <Screen>
      {picking ? (
        <AppBar
          title={
            <View className="flex-row items-center gap-2">
              <Button
                variant="ghost"
                size="compact"
                onPress={() => {
                  setPicking(false);
                  setPicked([]);
                }}
              >
                그만두기
              </Button>
              <Text size="lg" weight="semibold">
                열 날을 고르세요
              </Text>
            </View>
          }
        />
      ) : (
        <AppBar
          onBack={() => router.back()}
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
                {formatMonthTitle(month)}
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
              {confirmed ? <Badge label="확정" /> : null}
            </View>
          }
          right={
            schedule == null ? undefined : (
              <Button
                variant="ghost"
                size="compact"
                onPress={() => setPicking(true)}
              >
                날 열기
              </Button>
            )
          }
        />
      )}

      <ScrollView>
        <View className="gap-3 px-5 pb-8">
          {loadingWindow ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : schedule == null ? (
            <View className="items-center gap-6 py-16">
              <Icon icon={CalendarDays} size={EMPTY_ICON_SIZE} />
              <Text size="lg" weight="bold">
                {isMonthFullyPast({ month, now })
                  ? `${monthName} 근무표가 없어요`
                  : `${monthName} 근무표가 아직 없어요`}
              </Text>
              {isMonthFullyPast({ month, now }) ? null : (
                <>
                  <Text size="sm" tone="muted">
                    {`만들면 근무자들이 ${monthName} 근무 신청을 넣을 수 있어요`}
                  </Text>
                  <Button
                    variant="primary"
                    className="self-stretch"
                    onPress={() => setSheet("create")}
                  >
                    {`${monthName} 근무표 만들기`}
                  </Button>
                </>
              )}
            </View>
          ) : (
            <>
              {picking ? (
                <Text size="xs" tone="subtle">
                  닫힌 날만 고를 수 있어요
                </Text>
              ) : confirmed ? (
                <Text size="xs" tone="subtle" numeric>
                  {confirmedLine({
                    confirmedAt: schedule.confirmedAt ?? now,
                    notifiedCount,
                  })}
                </Text>
              ) : deadline === null ? null : (
                <Text size="xs" tone="subtle" numeric>
                  {deadlineLine({ applicationDeadline: deadline, now })}
                </Text>
              )}

              {dayList.length === 0 && !picking ? (
                <Text size="sm" tone="muted">
                  전부 닫힌 날이에요. 예식 있는 날을 열어주세요
                </Text>
              ) : null}

              {calendar}

              {confirmed || picking ? null : (
                <>
                  <Text size="xs" tone="subtle">
                    사람 표시는 근무 신청이에요
                  </Text>

                  <Card className="py-0">
                    <ListRow
                      title={`근무 신청 ${applications.length}건 모아보기`}
                      onPress={() =>
                        router.push(`/admin/applications?month=${month}`)
                      }
                    />
                  </Card>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {picking ? (
        <BottomCTA>
          <Button
            variant="primary"
            loading={open.isPending}
            disabled={picked.length === 0}
            onPress={() => void openPickedDays()}
          >
            {openDaysButtonLabel(picked.length)}
          </Button>
        </BottomCTA>
      ) : schedule == null || affordance === "ended" ? null : (
        <BottomCTA
          note={
            affordance === "locked" && deadline !== null ? (
              <View className="flex-row items-center justify-center gap-1">
                <Text size="xs" tone="subtle" numeric>
                  {confirmUnlockLine(deadline)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSheet("deadline")}
                >
                  <Text size="xs" tone="muted">
                    · 마감일 당기기
                  </Text>
                </Pressable>
              </View>
            ) : undefined
          }
        >
          <Button
            variant="primary"
            disabled={affordance === "locked"}
            onPress={() => setSheet("confirm")}
          >
            {affordance === "locked"
              ? "확정하기"
              : `${monthName} 근무표 확정하기`}
          </Button>
        </BottomCTA>
      )}

      {sheet === "create" ? (
        <SheetLayer onDismiss={closeSheet}>
          <CreateScheduleSheet
            month={month}
            today={today}
            saving={create.isPending}
            failed={create.isError}
            onClose={closeSheet}
            onCreate={(deadlineDate) =>
              create.mutate({ month, deadline: deadlineDate })
            }
          />
        </SheetLayer>
      ) : null}

      {sheet === "deadline" ? (
        <SheetLayer onDismiss={closeSheet}>
          <DeadlineSheet
            deadline={deadline ?? today}
            today={today}
            saving={changeDeadline.isPending}
            failed={changeDeadline.isError}
            onClose={closeSheet}
            onSave={(deadlineDate) =>
              changeDeadline.mutate({ month, deadline: deadlineDate })
            }
          />
        </SheetLayer>
      ) : null}

      {sheet === "confirm" ? (
        <SheetLayer onDismiss={closeSheet}>
          <ConfirmSheet
            month={month}
            openSlots={slotRows}
            notifiedCount={notifiedCount}
            confirming={confirm.isPending}
            done={confirm.isSuccess}
            failed={confirm.isError}
            onClose={() => {
              setSheet(null);
              confirm.reset();
            }}
            onConfirm={() => confirm.mutate({ month })}
          />
        </SheetLayer>
      ) : null}

      {toast ? (
        <FloatingToast kind="info" message={toast} onDone={hideToast} />
      ) : null}
    </Screen>
  );
}
