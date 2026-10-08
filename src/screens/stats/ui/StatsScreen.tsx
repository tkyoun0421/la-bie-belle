import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { NO_VALUE } from "@/shared/consts/noValue.const";
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
import { STATS_COPY, TAB_OPTIONS } from "@/screens/stats/consts/stats.const";
import { useStatsScreen } from "@/screens/stats/hooks/useStatsScreen";

const SKELETON_ROWS = [0, 1, 2];

function ArrowSlot() {
  return <View className="h-8 w-8" />;
}

export function StatsScreen() {
  const router = useRouter();
  const screen = useStatsScreen();

  return (
    <Screen floor="plain">
      <AppBar title={STATS_COPY.appBarTitle} onBack={() => router.back()} />

      <ScrollView>
        <View className="px-5 pb-8">
          <View className="mt-2 flex-row items-center justify-center gap-2 py-2">
            {screen.canGoPrev ? (
              <Button
                variant="ghost"
                size="compact"
                square
                testID="stats-month-prev"
                onPress={screen.goPrev}
              >
                <Icon icon={ChevronLeft} tone="subtle" />
              </Button>
            ) : (
              <ArrowSlot />
            )}

            <Text size="base" weight="medium" numeric>
              {screen.monthLabel}
            </Text>

            {screen.canGoNext ? (
              <Button
                variant="ghost"
                size="compact"
                square
                testID="stats-month-next"
                onPress={screen.goNext}
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
            value={screen.tab}
            onChange={screen.chooseTab}
          />

          <View className="mt-6">
            <TrendChart
              testID="stats-trend-chart"
              points={screen.points}
              selectedMonth={screen.selectedMonth}
              valueLabel={screen.trendValueLabel}
            />
          </View>

          {screen.listState === "loading" ? (
            <View className="mt-6 gap-4">
              <SkeletonLine className="h-9 w-2/3" />
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="w-2/3" />
              ))}
            </View>
          ) : screen.listState === "failed" ? (
            <View className="mt-6 flex-row items-center gap-2">
              <Text size="xs" tone="subtle">
                {STATS_COPY.readFailed}
              </Text>
              <Button variant="ghost" size="compact" onPress={screen.retry}>
                {STATS_COPY.retry}
              </Button>
            </View>
          ) : screen.listState === "empty" ? (
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
                  title={STATS_COPY.emptyTitle}
                  description={STATS_COPY.emptyBody}
                />
              </View>
            </View>
          ) : screen.listState === "attendance" ? (
            <View>
              <Text size="sm" tone="muted" numeric className="mt-6">
                {screen.attendanceLine}
              </Text>

              <View className="mt-3">
                <RatioBand
                  testID="stats-attendance-legend"
                  shares={screen.shares}
                />
              </View>

              <View className="mt-8">
                {screen.attendanceRows.map((row, at) => (
                  <ListRow
                    key={row.key}
                    divider={at > 0}
                    title={row.title}
                    detail={row.detail}
                    value={row.value}
                  />
                ))}
              </View>
            </View>
          ) : screen.listState === "position" ? (
            <View>
              <Text
                size="3xl"
                weight="bold"
                tone="brand"
                numeric
                className="mt-6"
              >
                {screen.totalLabel}
              </Text>

              <View className="mt-8">
                <RowBars
                  testID="stats-positions"
                  items={screen.positionRows.map((row) => ({
                    key: row.key,
                    value: row.weight,
                    row: (
                      <ListRow
                        title={row.title}
                        detail={row.detail}
                        value={row.value}
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
                {screen.amountLabel}
              </Text>

              <Text size="sm" tone="subtle" className="mt-1">
                {screen.estimateNote}
              </Text>

              <Text size="sm" tone="muted" numeric className="mt-3">
                {screen.payrollSubtitle}
              </Text>

              <View className="mt-8">
                <ListRow
                  testID="stats-payroll-history"
                  title={STATS_COPY.historyRow}
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
