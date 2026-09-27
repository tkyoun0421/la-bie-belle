import { useRouter } from "expo-router";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { supabase } from "@/shared/lib/supabase";
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
import { liveAssignmentCount } from "@/entities/schedule/dals/get-month-schedule";
import { useCloseDay } from "@/features/schedule/model/useCloseDay";
import { useConfirmSchedule } from "@/features/schedule/model/useConfirmSchedule";
import { useCreateSchedule } from "@/features/schedule/model/useCreateSchedule";
import { useMonthAvailabilities } from "@/features/schedule/model/useMonthAvailabilities";
import { useMonthSchedule } from "@/features/schedule/model/useMonthSchedule";
import { useMonthWindow } from "@/features/schedule/model/useMonthWindow";
import { useOpenDay } from "@/features/schedule/model/useOpenDay";
import { useOpenSlots } from "@/features/schedule/model/useOpenSlots";
import { useSetApplicationDeadline } from "@/features/schedule/model/useSetApplicationDeadline";
import { useSetDayHours } from "@/features/schedule/model/useSetDayHours";
import { DeadlineSheet } from "@/features/schedule/ui/DeadlineSheet";
import {
  adminCalendarDayState,
  confirmedVacancyCount,
} from "@/screens/schedule-admin/model/admin-calendar-day-state";
import {
  confirmAffordance,
  confirmUnlockLine,
} from "@/screens/schedule-admin/model/confirm-affordance";
import { deadlineLine } from "@/screens/schedule-admin/model/deadline-line";
import {
  confirmedLine,
  formatMonthName,
  kstDateOf,
} from "@/screens/schedule-admin/model/format-schedule-date";
import { countOpenSlotsByDate } from "@/screens/schedule-admin/model/group-open-slots";
import {
  isMonthFullyPast,
  shiftMonth,
} from "@/screens/schedule-admin/model/month-empty-state";
import {
  isSelectableForOpening,
  openDaysButtonLabel,
  openDaysFailureToast,
} from "@/screens/schedule-admin/model/open-mode-selection";
import { CloseDayWarningSheet } from "@/screens/schedule-admin/ui/CloseDayWarningSheet";
import { ConfirmSheet } from "@/screens/schedule-admin/ui/ConfirmSheet";
import { CreateScheduleSheet } from "@/screens/schedule-admin/ui/CreateScheduleSheet";
import { DayDetail } from "@/screens/schedule-admin/ui/DayDetail";
import { DayHoursSheet } from "@/screens/schedule-admin/ui/DayHoursSheet";

/**
 * 관리자가 근무표를 짜는 화면이다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`고 완료 조건은
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
 * **포지션 아홉 줄은 아직 없다.** 자리·배정·사람 픽커는 `schedule-assign`이, 임시공휴일과
 * 근무 조정은 `payroll-adjust`가 더한다(spec 「범위 밖」).
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

export type ScheduleAdminScreenProps = {
  month?: string;
  date?: string;
};

export function ScheduleAdminScreen({
  month: monthParam,
  date: dateParam,
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

  const { data: schedule, isLoading: loadingWindow } = useMonthWindow(
    supabase,
    month,
  );
  const { data: days } = useMonthSchedule(supabase, month);
  const { data: openSlots } = useOpenSlots(supabase, month);
  const { data: availabilities } = useMonthAvailabilities(supabase, month);

  const create = useCreateSchedule(supabase);
  const changeDeadline = useSetApplicationDeadline(supabase);
  const open = useOpenDay(supabase);
  const close = useCloseDay(supabase);
  const setHours = useSetDayHours(supabase);
  const confirm = useConfirmSchedule(supabase);

  const closeSheet = useCallback(() => setSheet(null), []);
  const hideToast = useCallback(() => setToast(null), []);

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

  for (const row of applications) {
    applicationCountOf.set(
      row.work_date,
      (applicationCountOf.get(row.work_date) ?? 0) + 1,
    );

    const names = applicationNamesOf.get(row.work_date) ?? [];

    names.push(row.profiles?.display_name ?? "");
    applicationNamesOf.set(row.work_date, names);
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
          workDate={day.work_date}
          startsAt={day.starts_at}
          endsAt={day.ends_at}
          filledCount={assignmentCount}
          slotCount={day.slots.filter((slot) => slot.ended_at === null).length}
          applicationNames={applicationNamesOf.get(day.work_date) ?? []}
          isConfirmed={confirmed}
          onBack={() => setOpenDate(null)}
          onPressHours={() => setSheet("hours")}
          onCloseDay={() =>
            assignmentCount === 0
              ? close.mutate({ workDate: day.work_date })
              : setSheet("close")
          }
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
                {`${monthName} 근무표`}
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
