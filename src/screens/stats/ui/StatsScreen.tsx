import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import {
  kstToday,
  monthOf,
  shiftMonth,
  spellMonth,
} from "@/shared/lib/kst-date";
import { canGoBack, canGoForward } from "@/shared/lib/month-boundary";
import { NO_VALUE } from "@/shared/lib/no-value";
import { queryClient } from "@/shared/lib/query-client";
import { nowWithOffset } from "@/shared/lib/server-clock";
import { serverClockStore } from "@/shared/lib/server-clock-store";
import { spellWon } from "@/shared/lib/spell-number";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { RatioBand } from "@/shared/ui/RatioBand";
import { RowBars } from "@/shared/ui/RowBars";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { TrendChart } from "@/shared/ui/TrendChart";
import { useMyProfile } from "@/features/profile/model/useMyProfile";
import { useRehearsalMonths } from "@/features/rehearsal/model/useRehearsalMonths";
import {
  useAttendanceMonths,
  useFirstScheduleMonth,
  usePayrollMonthsByMonth,
  useWorkMonths,
} from "@/features/stats/api/useStatsQueries";
import {
  computeMyWorkTotals,
  type MyWorkTotals,
} from "@/features/stats/model/my-totals";
import { buildTrend, trendMonths } from "@/features/stats/model/trend";
import { hoursLabel, workInputsOf } from "@/features/stats/model/work-totals";
import {
  buildMyAttendanceDays,
  myAttendanceRow,
} from "@/screens/stats/model/attendance-days";
import { attendanceRatioShares } from "@/screens/stats/model/attendance-shares";
import { attendanceSummaryLine } from "@/screens/stats/model/attendance-summary-line";
import { myAttendanceTally } from "@/screens/stats/model/attendance-tally";
import {
  joinPayrollByMonth,
  myAttendanceValues,
  myPayrollDaysOfMonth,
  myPayrollValues,
  myWorkValues,
} from "@/screens/stats/model/chart-values";
import { tenThousandWonLabel } from "@/screens/stats/model/money-label";
import { myPayrollSubtitle } from "@/screens/stats/model/payroll-summary";

/**
 * 근무자가 자기 한 달을 숫자로 보는 화면이다. 정본은
 * `docs/2-design/system/screens/stats.md`의 근무자 몫이고 완료 조건은
 * `docs/2-design/spec/stats-worker.md`다.
 *
 * **여기만 금액이 있다.** 관리자 통계에는 급여 탭이 없다 — 자기 급여를 보는 것은 홀 전체
 * 인건비를 보는 것과 다른 자리다. 예상치 안내 한 줄도 이 탭에만 선다.
 *
 * **사람별 구획이 없다.** 볼 사람이 자기 하나라 근태는 날짜 목록이, 포지션은 내가 들어간 것만
 * 든 목록이 그 자리를 받는다.
 *
 * **달 줄이 세그먼트 위다.** 탭을 오가도 보는 달이 그대로고, 앱바·달 줄·세그먼트·추이 그래프
 * 넷까지가 관리자 화면과 같은 자리다.
 *
 * **새 키를 안 연다.** 열두 달을 `['schedule', 'YYYY-MM']`·`['attendance', 'YYYY-MM']`·
 * `['payroll', 'YYYY-MM']`·`['rehearsal', 'YYYY-MM']`로 읽어서 근무표·급여 화면이 이미 읽어둔
 * 달은 캐시에서 온다.
 *
 * **다시 들어오면 이번 달이다.** 보던 달도 보던 탭도 기억하지 않는다.
 */

const ATTENDANCE = "attendance";

const POSITION = "position";

const PAYROLL = "payroll";

const TAB_OPTIONS = [
  { value: ATTENDANCE, label: "근태" },
  { value: POSITION, label: "포지션" },
  { value: PAYROLL, label: "급여" },
];

const EMPTY_TITLE = "이 달은 근무가 없어요";

const EMPTY_DESCRIPTION = "근무가 잡히면 여기 숫자가 서요";

const ESTIMATE_NOTE = "예상치예요. 실제 지급액과 다를 수 있어요";

const HISTORY_ROW = "내역 보기";

const READ_FAILED = "통계를 불러오지 못했어요";

const SKELETON_ROWS = [0, 1, 2];

const MONTH_LENGTH = 7;

/** 탭에 없는 쪽은 열두 달을 안 읽는다. 배열을 그때그때 만들면 질의가 매 렌더 새로 선다. */
const NO_MONTHS: string[] = [];

/**
 * 무효화 키를 여기 다시 적은 것은 슬라이스끼리 서로를 못 불러서다(lint 규칙 3) — 정본은 코드가
 * 아니라 `docs/2-design/system/runtime.md`의 「TanStack Query 규칙」이다.
 */
const RETRY_KEYS = [["schedule"], ["attendance"], ["payroll"], ["rehearsal"]];

/** 못 가는 화살표는 안 그린다. 달 글이 가운데에 그대로 서게 자리만 남긴다. */
function ArrowSlot() {
  return <View className="h-8 w-8" />;
}

export function StatsScreen() {
  const router = useRouter();
  const today = kstToday();

  const [me, setMe] = useState<string | null>(null);
  const [tab, setTab] = useState(ATTENDANCE);
  const [month, setMonth] = useState(() => monthOf(today));

  const { data: profile, isLoading: profileLoading } = useMyProfile(
    supabase,
    me,
  );
  const clockOffset = serverClockStore((at) => at.offset);

  useEffect(() => {
    void getCurrentUser(supabase).then((user) => setMe(user?.id ?? null));
  }, []);

  const months = useMemo(() => trendMonths(month), [month]);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();
  const profileId = profile?.id ?? null;

  const work = useWorkMonths(supabase, tab === ATTENDANCE ? NO_MONTHS : months);
  const attendance = useAttendanceMonths(
    supabase,
    tab === ATTENDANCE ? months : NO_MONTHS,
  );
  const payroll = usePayrollMonthsByMonth(
    supabase,
    tab === PAYROLL ? months : NO_MONTHS,
  );
  const rehearsal = useRehearsalMonths(
    supabase,
    tab === PAYROLL ? months : NO_MONTHS,
  );
  const firstMonth = useFirstScheduleMonth(supabase);

  const sources: readonly { isLoading: boolean; error: Error | null }[] =
    tab === ATTENDANCE
      ? [attendance]
      : tab === POSITION
        ? [work]
        : [work, payroll, rehearsal];

  const loading = profileLoading || sources.some((one) => one.isLoading);
  const failed = sources.some((one) => one.error !== null);

  const shownAttendance = attendance.data?.find((one) => one.month === month);
  const shownWork = work.data?.find((one) => one.month === month);

  const tally = useMemo(
    () =>
      myAttendanceTally(
        shownAttendance?.days ?? [],
        shownAttendance?.attendance.checkIns ?? [],
        shownAttendance?.attendance.excuseStatuses ?? [],
        profileId,
        now,
      ),
    [shownAttendance, profileId, now],
  );

  const attendanceDays = useMemo(
    () =>
      profileId === null || shownAttendance === undefined
        ? []
        : buildMyAttendanceDays(
            profileId,
            shownAttendance.days,
            shownAttendance.attendance.checkIns,
            shownAttendance.attendance.excuseStatuses,
            now,
          ),
    [profileId, shownAttendance, now],
  );

  const totals = useMemo<MyWorkTotals>(() => {
    if (profileId === null) {
      return { totalMinutes: 0, totalCount: 0, byPosition: [] };
    }

    const inputs = workInputsOf(shownWork?.days ?? []);

    return computeMyWorkTotals(inputs.assignments, inputs.days, profileId);
  }, [shownWork, profileId]);

  const payrollLoaded = useMemo(
    () => joinPayrollByMonth(work.data, payroll.data),
    [work.data, payroll.data],
  );

  const payrollDays = useMemo(
    () =>
      myPayrollDaysOfMonth(
        payrollLoaded,
        month,
        profileId,
        now,
        rehearsal.data ?? [],
      ),
    [payrollLoaded, month, profileId, rehearsal.data, now],
  );

  const values = useMemo(() => {
    if (profileId === null) {
      return new Map<string, number>();
    }

    return tab === ATTENDANCE
      ? myAttendanceValues(attendance.data, profileId, now)
      : tab === POSITION
        ? myWorkValues(work.data, profileId)
        : myPayrollValues(payrollLoaded, profileId, now, rehearsal.data ?? []);
  }, [
    tab,
    profileId,
    attendance.data,
    work.data,
    payrollLoaded,
    rehearsal.data,
    now,
  ]);

  const points = useMemo(
    () =>
      buildTrend(months, values).map((point) => ({
        month: Number(point.month.slice(5, MONTH_LENGTH)),
        value: point.value,
      })),
    [months, values],
  );

  const empty =
    tab === ATTENDANCE
      ? attendanceDays.length === 0
      : tab === POSITION
        ? totals.totalCount === 0
        : payrollDays.length === 0;

  const payrollTotal = values.get(month) ?? 0;

  const goMonth = (step: number) => setMonth(shiftMonth(month, step));

  const retry = () => {
    for (const key of RETRY_KEYS) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };

  return (
    <Screen floor="plain">
      <AppBar title="통계" onBack={() => router.back()} />

      <ScrollView>
        <View className="px-5 pb-8">
          <View className="mt-2 flex-row items-center justify-center gap-2 py-2">
            {firstMonth.data != null && canGoBack(month, firstMonth.data) ? (
              <Button
                variant="ghost"
                size="compact"
                square
                testID="stats-month-prev"
                onPress={() => goMonth(-1)}
              >
                <Icon icon={ChevronLeft} tone="subtle" />
              </Button>
            ) : (
              <ArrowSlot />
            )}

            <Text size="base" weight="medium" numeric>
              {spellMonth(month)}
            </Text>

            {canGoForward(month, today) ? (
              <Button
                variant="ghost"
                size="compact"
                square
                testID="stats-month-next"
                onPress={() => goMonth(1)}
              >
                <Icon icon={ChevronRight} tone="subtle" />
              </Button>
            ) : (
              <ArrowSlot />
            )}
          </View>

          <Segment
            className="mt-3"
            testID="stats-segment"
            options={TAB_OPTIONS}
            value={tab}
            onChange={setTab}
          />

          <View className="mt-6">
            <TrendChart
              testID="stats-trend-chart"
              points={points}
              selectedMonth={Number(month.slice(5, MONTH_LENGTH))}
              valueLabel={
                loading || failed || empty
                  ? undefined
                  : tab === ATTENDANCE
                    ? `${values.get(month) ?? 0}%`
                    : tab === POSITION
                      ? hoursLabel(totals.totalMinutes)
                      : tenThousandWonLabel(payrollTotal)
              }
            />
          </View>

          {loading ? (
            <View className="mt-6 gap-4">
              <SkeletonLine className="h-9 w-2/3" />
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="w-2/3" />
              ))}
            </View>
          ) : failed ? (
            <View className="mt-6 flex-row items-center gap-2">
              <Text size="xs" tone="subtle">
                {READ_FAILED}
              </Text>
              <Button variant="ghost" size="compact" onPress={retry}>
                다시 시도
              </Button>
            </View>
          ) : empty ? (
            <View>
              <Text
                size="3xl"
                weight="bold"
                tone="brand"
                numeric
                className="mt-6"
              >
                {NO_VALUE}
              </Text>

              <View className="mt-8">
                <EmptyState
                  scene="no-shifts"
                  title={EMPTY_TITLE}
                  description={EMPTY_DESCRIPTION}
                />
              </View>
            </View>
          ) : tab === ATTENDANCE ? (
            <View>
              <Text size="sm" tone="muted" numeric className="mt-6">
                {attendanceSummaryLine(tally)}
              </Text>

              <View className="mt-3">
                <RatioBand
                  testID="stats-attendance-legend"
                  shares={attendanceRatioShares(tally)}
                />
              </View>

              <View className="mt-8">
                {attendanceDays.map((day, at) => {
                  const row = myAttendanceRow(day);

                  return (
                    <ListRow
                      key={day.workDate}
                      divider={at > 0}
                      title={row.title}
                      detail={row.subtitle}
                      value={row.value}
                    />
                  );
                })}
              </View>
            </View>
          ) : tab === POSITION ? (
            <View>
              <Text
                size="3xl"
                weight="bold"
                tone="brand"
                numeric
                className="mt-6"
              >
                {hoursLabel(totals.totalMinutes)}
              </Text>

              <View className="mt-8">
                <RowBars
                  testID="stats-positions"
                  items={totals.byPosition.map((row) => ({
                    key: row.position,
                    value: row.minutes,
                    row: (
                      <ListRow
                        title={row.position}
                        detail={`${row.count}건`}
                        value={hoursLabel(row.minutes)}
                      />
                    ),
                  }))}
                />
              </View>
            </View>
          ) : (
            <View>
              <Text
                size="3xl"
                weight="bold"
                tone="brand"
                numeric
                className="mt-6"
              >
                {spellWon(payrollTotal)}
              </Text>

              <Text size="sm" tone="subtle" className="mt-1">
                {ESTIMATE_NOTE}
              </Text>

              <Text size="sm" tone="muted" numeric className="mt-3">
                {myPayrollSubtitle(payrollDays)}
              </Text>

              <View className="mt-8">
                <ListRow
                  testID="stats-payroll-history"
                  title={HISTORY_ROW}
                  chevron
                  onPress={() => router.push("/payroll")}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
