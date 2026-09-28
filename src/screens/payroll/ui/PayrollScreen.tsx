import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import { kstDateOf, kstToday } from "@/shared/lib/kst-date";
import { queryClient } from "@/shared/lib/query-client";
import { nowWithOffset } from "@/shared/lib/server-clock";
import { serverClockStore } from "@/shared/lib/server-clock-store";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { payrollViewDays } from "@/features/payroll/model/payroll-days";
import { PAYROLL_KEY } from "@/features/payroll/model/query-keys";
import { usePayrollMonths } from "@/features/payroll/model/usePayrollMonths";
import { useMyProfile } from "@/features/profile/model/useMyProfile";
import { REHEARSAL_KEY } from "@/features/rehearsal/model/query-keys";
import { useRehearsalMonths } from "@/features/rehearsal/model/useRehearsalMonths";
import { SCHEDULE_KEY } from "@/features/schedule/model/query-keys";
import { useScheduleMonths } from "@/features/schedule/model/useScheduleMonths";
import { canGoBack, canGoForward } from "@/screens/payroll/model/boundary";
import { payrollHistoryRows } from "@/screens/payroll/model/history-rows";
import {
  isInPeriod,
  periodLabel,
  periodMonthKeys,
  periodOf,
  periodStartDate,
  periodUnitOf,
  shiftPeriod,
  type PeriodUnit,
} from "@/screens/payroll/model/period";
import {
  summarizeAccrual,
  summarizeAmount,
} from "@/screens/payroll/model/summary";
import { monthRowsOfDays, yearRows } from "@/screens/payroll/model/year-rows";

/**
 * 근무자가 자기 급여를 미리 보는 화면이다. 정본은
 * `docs/2-design/modules/payroll/screens/payroll.md`고 완료 조건은
 * `docs/2-design/spec/payroll-view.md`다.
 *
 * **금액을 여기서 안 낸다.** 세 키(`['payroll']`·`['schedule']`·`['rehearsal']`)가 낸 행을
 * `payrollViewDays`에 통째로 넘기고, 이 파일이 받는 것은 날 목록 하나다. 그 목록을 기간으로
 * 잘라 문구로 바꾸는 것도 `screens/payroll/model`의 함수들이 한다.
 *
 * **기간이 날짜 하나와 단위 둘로 산다.** 세그먼트가 단위를 고르고 화살표가 그 단위 안에서
 * 날짜를 옮긴다 — 둘을 한 상태로 합치면 「주」로 갔다 「월」로 돌아올 때 보던 달을 잃는다.
 *
 * **퇴사한 사람도 이 화면을 본다**([ACC-011](../../../../docs/2-design/modules/account/README.md#acc-011)).
 * 탭 바를 지우는 것은 탭 껍데기의 일이라 `src/app/(tabs)/_layout.tsx`가 맡고, 여기는 앱바의
 * 뒤로와 종 아이콘만 그 사람에 맞춰 바꾼다 — 퇴사한 뒤로는 알림이 안 온다.
 */

const ESTIMATE_NOTE = "예상치예요. 실제 지급액과 다를 수 있어요";

const READ_FAILED = "급여를 불러오지 못했어요";

const EMPTY_TITLE = "아직 근무가 없어요";

const EMPTY_DESCRIPTION = "근무한 날이 생기면 여기 서요";

const TOTAL_TITLE = "합계";

const UNIT_OPTIONS = [
  { value: "week", label: "주" },
  { value: "month", label: "월" },
  { value: "year", label: "연" },
];

const SKELETON_ROWS = [0, 1, 2];

/** 못 가는 화살표는 안 그린다. 기간 글이 가운데에 그대로 서게 자리만 남긴다. */
function ArrowSlot() {
  return <View className="h-8 w-8" />;
}

export function PayrollScreen() {
  const router = useRouter();
  const today = kstToday();

  const [me, setMe] = useState<string | null>(null);
  const [unit, setUnit] = useState<PeriodUnit>("month");
  const [anchorDate, setAnchorDate] = useState(today);

  const { data: profile, isLoading: profileLoading } = useMyProfile(
    supabase,
    me,
  );
  const clockOffset = serverClockStore((at) => at.offset);

  useEffect(() => {
    void getCurrentUser(supabase).then((user) => setMe(user?.id ?? null));
  }, []);

  const period = useMemo(() => periodOf(anchorDate, unit), [anchorDate, unit]);
  const months = useMemo(() => periodMonthKeys(period), [period]);

  const payroll = usePayrollMonths(supabase, months);
  const schedule = useScheduleMonths(supabase, months);
  const rehearsal = useRehearsalMonths(supabase, months);

  const profileId = profile?.id ?? null;

  const days = useMemo(() => {
    if (
      profileId === null ||
      payroll.data === undefined ||
      schedule.data === undefined ||
      rehearsal.data === undefined
    ) {
      return [];
    }

    return payrollViewDays({
      profileId,
      days: schedule.data,
      rates: payroll.data.wageRates,
      adjustments: payroll.data.adjustments,
      excuses: payroll.data.excuseStatus,
      rehearsals: rehearsal.data,
      now: new Date(nowWithOffset(Date.now(), clockOffset)).toISOString(),
    });
  }, [profileId, payroll.data, schedule.data, rehearsal.data, clockOffset]);

  const shown = useMemo(
    () => days.filter((day) => isInPeriod(period, day.date)),
    [days, period],
  );

  const loading =
    profileLoading ||
    payroll.isLoading ||
    schedule.isLoading ||
    rehearsal.isLoading;
  const failed =
    payroll.error !== null ||
    schedule.error !== null ||
    rehearsal.error !== null;

  const accrual = summarizeAccrual(shown);
  const historyRows = payrollHistoryRows(shown);
  const monthRows = yearRows(monthRowsOfDays(shown));

  const approvedDate =
    profile?.approved_at == null ? null : kstDateOf(profile.approved_at);
  const leftDate = profile?.left_at == null ? null : kstDateOf(profile.left_at);
  const hasLeft = leftDate !== null;

  const goPeriod = (step: number) =>
    setAnchorDate(periodStartDate(shiftPeriod(period, step)));

  const goMonthOf = (month: string) => {
    setUnit("month");
    setAnchorDate(`${month}-01`);
  };

  const retry = () => {
    for (const key of [PAYROLL_KEY, SCHEDULE_KEY, REHEARSAL_KEY]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };

  return (
    <Screen floor="plain">
      <AppBar
        title="급여"
        onBack={hasLeft ? () => router.replace("/left") : undefined}
        right={
          hasLeft ? undefined : (
            <BellIcon onPress={() => router.push("/notifications")} />
          )
        }
      />

      <ScrollView>
        <View className="px-5 pb-4">
          <Segment
            className="mt-2"
            testID="payroll-segment"
            options={UNIT_OPTIONS}
            value={unit}
            onChange={(value) => setUnit(periodUnitOf(value))}
          />

          <View className="mt-5 flex-row items-center justify-center gap-2 py-2">
            {approvedDate !== null && canGoBack(period, approvedDate) ? (
              <Button
                variant="ghost"
                size="compact"
                square
                testID="payroll-period-prev"
                onPress={() => goPeriod(-1)}
              >
                <Icon icon={ChevronLeft} tone="subtle" />
              </Button>
            ) : (
              <ArrowSlot />
            )}

            <Text size="base" weight="medium" numeric>
              {periodLabel(period)}
            </Text>

            {canGoForward(period, { today, leftAt: leftDate }) ? (
              <Button
                variant="ghost"
                size="compact"
                square
                testID="payroll-period-next"
                onPress={() => goPeriod(1)}
              >
                <Icon icon={ChevronRight} tone="subtle" />
              </Button>
            ) : (
              <ArrowSlot />
            )}
          </View>

          {loading ? (
            <SkeletonLine className="mt-4 h-9 w-2/3" />
          ) : (
            <Text
              size="3xl"
              weight="bold"
              tone="brand"
              numeric
              className="mt-4"
            >
              {summarizeAmount(shown)}
            </Text>
          )}

          <Text size="sm" tone="subtle" className="mt-1">
            {ESTIMATE_NOTE}
          </Text>

          {loading ? null : (
            <View className="mt-6 gap-2">
              <View className="flex-row items-baseline justify-between">
                <Text size="sm" tone="muted">
                  근무
                </Text>
                <Text size="sm" weight="medium" numeric>
                  {accrual.work}
                </Text>
              </View>

              {accrual.late === null ? null : (
                <View className="flex-row items-baseline justify-between">
                  <Text size="sm" tone="muted">
                    지각
                  </Text>
                  <Text size="sm" weight="medium" numeric>
                    {accrual.late}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="mt-8">
            {loading ? (
              <View className="gap-4">
                {SKELETON_ROWS.map((at) => (
                  <SkeletonLine key={at} className="w-2/3" />
                ))}
              </View>
            ) : failed ? (
              <View className="flex-row items-center gap-2">
                <Text size="xs" tone="subtle">
                  {READ_FAILED}
                </Text>
                <Button variant="ghost" size="compact" onPress={retry}>
                  다시 시도
                </Button>
              </View>
            ) : shown.length === 0 ? (
              <EmptyState
                scene="no-shifts"
                title={EMPTY_TITLE}
                description={EMPTY_DESCRIPTION}
              />
            ) : unit === "year" ? (
              monthRows.map((row, at) =>
                row.type === "month" ? (
                  <ListRow
                    key={row.month}
                    divider={at > 0}
                    title={row.title}
                    value={row.amountLabel}
                    onPress={() => goMonthOf(row.month)}
                  />
                ) : (
                  <ListRow
                    key="total"
                    divider={at > 0}
                    title={TOTAL_TITLE}
                    value={row.amountLabel}
                  />
                ),
              )
            ) : (
              historyRows.map((row, at) => (
                <ListRow
                  key={row.date}
                  divider={at > 0}
                  title={row.title}
                  detail={row.subtitle}
                  value={row.amountLabel}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
