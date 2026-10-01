import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  kstToday,
  monthOf,
  shiftMonth,
  spellDate,
  spellMonth,
} from "@/shared/lib/kstDate";
import { canGoBack, canGoForward } from "@/shared/lib/monthBoundary";
import { NO_VALUE } from "@/shared/lib/noValue";
import { queryClient } from "@/shared/lib/queryClient";
import { nowWithOffset } from "@/shared/lib/serverClock";
import { serverClockStore } from "@/shared/lib/serverClockStore";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { RatioBand } from "@/shared/ui/RatioBand";
import { RowBars } from "@/shared/ui/RowBars";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { TrendChart } from "@/shared/ui/TrendChart";
import { useFirstScheduleMonthQuery } from "@/entities/schedule/hooks/useFirstScheduleMonthQuery";
import { useWorkMonthsQuery } from "@/entities/schedule/hooks/useWorkMonthsQuery";
import { useAttendanceMonths } from "@/features/stats/hooks/useAttendanceMonths";
import { computePersonDays } from "@/features/stats/model/personDays";
import { buildTrend, trendMonths } from "@/features/stats/model/trend";
import {
  computeWorkTotals,
  hoursLabel,
  workInputsOf,
} from "@/features/stats/model/workTotals";
import {
  attendanceRowValue,
  buildAttendanceTab,
  type AttendanceTab,
} from "@/screens/adminStats/model/attendanceRows";
import {
  attendanceValues,
  monthIn,
  percentLabel,
  workValues,
} from "@/screens/adminStats/model/chartValues";
import { WorkDaysSheet } from "@/screens/adminStats/ui/WorkDaysSheet";

/**
 * 관리자가 한 달을 숫자로 보는 화면이다. 정본은
 * `docs/2-design/system/screens/stats.md`의 관리자 몫이고 완료 조건은
 * `docs/2-design/spec/stats-admin.md`다.
 *
 * **금액이 없다.** 이 화면이 세는 것은 시간과 회수와 비율이고 시급을 아예 안 읽는다.
 *
 * **달 줄이 세그먼트 위다.** 탭을 오가도 보는 달이 그대로고, 앱바·달 줄·세그먼트·추이
 * 그래프까지가 두 탭에서 같은 자리다.
 *
 * **새 키를 안 연다.** 열두 달을 `['schedule', 'YYYY-MM']`과 `['attendance', 'YYYY-MM']`로
 * 읽어서 근무표·급여 화면이 이미 읽어둔 달은 캐시에서 온다.
 *
 * **다시 들어오면 이번 달이다.** 보던 달도 보던 탭도 기억하지 않는다.
 */

const WORK = "work";

const ATTENDANCE = "attendance";

const TAB_OPTIONS = [
  { value: WORK, label: "근무" },
  { value: ATTENDANCE, label: "근태" },
];

const EMPTY_TITLE = "이 달은 아직 근무표가 없어요";

const EMPTY_DESCRIPTION = "근무를 넣으면 여기 숫자가 서요";

const READ_FAILED = "통계를 불러오지 못했어요";

const AVATAR_SIZE = 40;

const SKELETON_ROWS = [0, 1, 2];

/** 탭에 없는 쪽은 열두 달을 안 읽는다. 배열을 그때그때 만들면 질의가 매 렌더 새로 선다. */
const NO_MONTHS: string[] = [];

const EMPTY_TALLY: AttendanceTab = {
  tally: { present: 0, late: 0, absent: 0, excused: 0 },
  rows: [],
};

/** 못 가는 화살표는 안 그린다. 달 글이 가운데에 그대로 서게 자리만 남긴다. */
function ArrowSlot() {
  return <View className="h-8 w-8" />;
}

export function AdminStatsScreen() {
  const router = useRouter();
  const today = kstToday();

  const [tab, setTab] = useState(WORK);
  const [month, setMonth] = useState(() => monthOf(today));
  const [openPerson, setOpenPerson] = useState<string | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const months = useMemo(() => trendMonths(month), [month]);

  const work = useWorkMonthsQuery(supabase, tab === WORK ? months : NO_MONTHS);
  const attendance = useAttendanceMonths(
    supabase,
    tab === ATTENDANCE ? months : NO_MONTHS,
  );
  const firstMonth = useFirstScheduleMonthQuery(supabase);

  const workInputs = useMemo(
    () => workInputsOf(monthIn(work.data, month)?.days ?? []),
    [work.data, month],
  );
  const totals = useMemo(
    () => computeWorkTotals(workInputs.assignments, workInputs.days),
    [workInputs],
  );

  const attendanceByMonth = useMemo(() => {
    const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

    return new Map(
      (attendance.data ?? []).map((one) => [
        one.month,
        buildAttendanceTab(
          one.days,
          one.attendance.checkIns,
          one.attendance.excuseStatuses,
          now,
        ),
      ]),
    );
  }, [attendance.data, clockOffset]);

  const attendanceTab = attendanceByMonth.get(month) ?? EMPTY_TALLY;

  const points = useMemo(
    () =>
      buildTrend(
        months,
        tab === WORK
          ? workValues(work.data)
          : attendanceValues(attendance.data, attendanceByMonth),
      ).map((point) => ({
        month: Number(point.month.slice(5, 7)),
        value: point.value,
      })),
    [months, tab, work.data, attendance.data, attendanceByMonth],
  );

  const active = tab === WORK ? work : attendance;
  const loading = active.isLoading;
  const failed = active.error !== null;
  const empty =
    tab === WORK ? totals.totalCount === 0 : attendanceTab.rows.length === 0;

  const person = openPerson;
  const personDays =
    person === null
      ? null
      : computePersonDays(person, workInputs.assignments, workInputs.days);
  const personName =
    totals.byPerson.find((row) => row.profileId === person)?.displayName ?? "";

  const goMonth = (step: number) => setMonth(shiftMonth(month, step));

  const retry = () => {
    for (const key of [["schedule"], ["attendance"]]) {
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
              selectedMonth={Number(month.slice(5, 7))}
              valueLabel={
                loading || failed || empty
                  ? undefined
                  : tab === WORK
                    ? hoursLabel(totals.totalMinutes)
                    : percentLabel(attendanceTab)
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
          ) : tab === WORK ? (
            <View>
              <Text size="3xl" weight="bold" numeric className="mt-6">
                {empty ? NO_VALUE : hoursLabel(totals.totalMinutes)}
              </Text>

              {empty ? (
                <View className="mt-8">
                  <EmptyState
                    scene="no-schedule"
                    title={EMPTY_TITLE}
                    description={EMPTY_DESCRIPTION}
                  />
                </View>
              ) : (
                <View>
                  <Text size="sm" tone="muted" numeric className="mt-3">
                    {`근무 ${totals.totalCount}건`}
                  </Text>

                  <SectionHeader label="사람별" />
                  <RowBars
                    testID="stats-people"
                    items={totals.byPerson.map((row) => ({
                      key: row.profileId,
                      value: row.minutes,
                      row: (
                        <ListRow
                          testID={`stats-person-${row.profileId}`}
                          left={
                            <Avatar name={row.displayName} size={AVATAR_SIZE} />
                          }
                          title={row.displayName}
                          detail={`${row.count}회`}
                          value={hoursLabel(row.minutes)}
                          valueTone="answer"
                          chevron
                          onPress={() => setOpenPerson(row.profileId)}
                        />
                      ),
                    }))}
                  />

                  <SectionHeader label="포지션" />
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
                          valueTone={row.minutes === 0 ? "zero" : "answer"}
                        />
                      ),
                    }))}
                  />
                </View>
              )}
            </View>
          ) : empty ? (
            <View className="mt-8">
              <EmptyState
                scene="no-schedule"
                title={EMPTY_TITLE}
                description={EMPTY_DESCRIPTION}
              />
            </View>
          ) : (
            <View>
              <Text size="sm" tone="muted" numeric className="mt-6">
                {`출근 ${attendanceTab.tally.present} · 지각 ${attendanceTab.tally.late} · 출근 인정 ${attendanceTab.tally.excused} · 결근 ${attendanceTab.tally.absent}`}
              </Text>

              <View className="mt-3">
                <RatioBand
                  testID="stats-attendance-legend"
                  shares={[
                    {
                      key: "present",
                      label: "출근",
                      value: attendanceTab.tally.present,
                    },
                    {
                      key: "excused",
                      label: "인정",
                      value: attendanceTab.tally.excused,
                    },
                    {
                      key: "late",
                      label: "지각",
                      value: attendanceTab.tally.late,
                    },
                    {
                      key: "absent",
                      label: "결근",
                      value: attendanceTab.tally.absent,
                    },
                  ]}
                />
              </View>

              <View className="mt-8">
                {attendanceTab.rows.map((row, at) => (
                  <ListRow
                    key={row.profileId}
                    divider={at > 0}
                    left={<Avatar name={row.displayName} size={AVATAR_SIZE} />}
                    title={row.displayName}
                    value={attendanceRowValue(row)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {personDays === null ? null : (
        <SheetLayer onDismiss={() => setOpenPerson(null)}>
          <WorkDaysSheet
            name={personName}
            rows={personDays.days.map((row) => ({
              key: `${row.workDate}-${row.position}`,
              title: `${spellDate(row.workDate)} · ${row.label}`,
              value: hoursLabel(row.minutes),
            }))}
            total={`합계 · ${personDays.totalCount}회 · ${hoursLabel(personDays.totalMinutes)}`}
          />
        </SheetLayer>
      )}
    </Screen>
  );
}

/** 가는 선 아래에 머리글이 서고 그 아래에 줄이 온다 — 직원 화면의 퇴사 구획과 같은 꼴이다. */
function SectionHeader({ label }: { label: string }) {
  return (
    <View className="mt-8">
      <Divider />
      <View className="py-2">
        <Text size="xs" weight="medium" tone="subtle">
          {label}
        </Text>
      </View>
    </View>
  );
}
