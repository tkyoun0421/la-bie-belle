import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { TrendChart } from "@/shared/ui/TrendChart";
import { StatsMonthNav } from "@/features/stats/ui/StatsMonthNav";
import { WorkDaysSheet } from "@/features/stats/ui/WorkDaysSheet";
import {
  ADMIN_STATS_COPY,
  TAB_OPTIONS,
  SKELETON_ROWS,
} from "@/screens/adminStats/consts/adminStats.const";
import { useAdminStatsScreen } from "@/screens/adminStats/hooks/useAdminStatsScreen";
import { AdminStatsBody } from "@/screens/adminStats/ui/AdminStatsBody";
import { AdminStatsFailed } from "@/screens/adminStats/ui/AdminStatsFailed";

export function AdminStatsScreen() {
  const screen = useAdminStatsScreen();

  return (
    <Screen floor="plain">
      <AppBar title={ADMIN_STATS_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="px-5 pb-8">
          <StatsMonthNav
            month={screen.month}
            onPrev={screen.goPrev}
            onNext={screen.goNext}
          />

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

          <AdminStatsBody screen={screen} />
        </View>
      </ScrollView>

      {screen.openPerson === null ? null : (
        <SheetLayer onDismiss={screen.closeSheet}>
          <WorkDaysSheet
            month={screen.month}
            profileId={screen.openPerson}
            pending={<SkeletonRows rows={SKELETON_ROWS} frame="headed" />}
            failed={<AdminStatsFailed onRetry={screen.retry} />}
          />
        </SheetLayer>
      )}
    </Screen>
  );
}
