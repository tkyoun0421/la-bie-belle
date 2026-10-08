import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { NO_VALUE } from "@/shared/consts/noValue.const";
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
import {
  ADMIN_STATS_COPY,
  AVATAR_SIZE,
  TAB_OPTIONS,
} from "@/screens/adminStats/consts/adminStats.const";
import { useAdminStatsScreen } from "@/screens/adminStats/hooks/useAdminStatsScreen";
import { WorkDaysSheet } from "@/screens/adminStats/ui/WorkDaysSheet";

const SKELETON_ROWS = [0, 1, 2];

function ArrowSlot() {
  return <View className="h-8 w-8" />;
}

export function AdminStatsScreen() {
  const router = useRouter();
  const screen = useAdminStatsScreen();

  return (
    <Screen floor="plain">
      <AppBar
        title={ADMIN_STATS_COPY.appBarTitle}
        onBack={() => router.back()}
      />

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
                {ADMIN_STATS_COPY.readFailed}
              </Text>
              <Button variant="ghost" size="compact" onPress={screen.retry}>
                {ADMIN_STATS_COPY.retry}
              </Button>
            </View>
          ) : screen.listState === "empty" ? (
            <View>
              {screen.tab === "work" ? (
                <Text size="3xl" weight="bold" numeric className="mt-6">
                  {NO_VALUE}
                </Text>
              ) : null}

              <View className="mt-8">
                <EmptyState
                  scene="no-schedule"
                  title={ADMIN_STATS_COPY.emptyTitle}
                  description={ADMIN_STATS_COPY.emptyBody}
                />
              </View>
            </View>
          ) : screen.listState === "work" ? (
            <View>
              <Text size="3xl" weight="bold" numeric className="mt-6">
                {screen.totalLabel}
              </Text>

              <Text size="sm" tone="muted" numeric className="mt-3">
                {screen.countLine}
              </Text>

              <SectionHeader label={ADMIN_STATS_COPY.peopleSection} />
              <RowBars
                testID="stats-people"
                items={screen.peopleRows.map((row) => ({
                  key: row.key,
                  value: row.weight,
                  row: (
                    <ListRow
                      testID={`stats-person-${row.profileId}`}
                      left={
                        <Avatar name={row.displayName} size={AVATAR_SIZE} />
                      }
                      title={row.displayName}
                      detail={row.detail}
                      value={row.value}
                      valueTone="answer"
                      chevron
                      onPress={row.press}
                    />
                  ),
                }))}
              />

              <SectionHeader label={ADMIN_STATS_COPY.positionSection} />
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
                      valueTone={row.isZero ? "zero" : "answer"}
                    />
                  ),
                }))}
              />
            </View>
          ) : (
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
                    left={<Avatar name={row.displayName} size={AVATAR_SIZE} />}
                    title={row.displayName}
                    value={row.value}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {screen.sheet === null ? null : (
        <SheetLayer onDismiss={screen.closeSheet}>
          <WorkDaysSheet
            name={screen.sheet.name}
            rows={screen.sheet.rows}
            total={screen.sheet.total}
          />
        </SheetLayer>
      )}
    </Screen>
  );
}

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
