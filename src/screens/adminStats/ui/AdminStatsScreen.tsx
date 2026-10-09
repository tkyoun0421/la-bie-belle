import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { TrendChart } from "@/shared/ui/TrendChart";
import {
  ADMIN_STATS_COPY,
  TAB_OPTIONS,
} from "@/screens/adminStats/consts/adminStats.const";
import { useAdminStatsScreen } from "@/screens/adminStats/hooks/useAdminStatsScreen";
import { AdminStatsBody } from "@/screens/adminStats/ui/AdminStatsBody";
import { AdminStatsMonthNav } from "@/screens/adminStats/ui/AdminStatsMonthNav";
import { WorkDaysSheet } from "@/screens/adminStats/ui/WorkDaysSheet";

export function AdminStatsScreen() {
  const screen = useAdminStatsScreen();

  return (
    <Screen floor="plain">
      <AppBar title={ADMIN_STATS_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="px-5 pb-8">
          <AdminStatsMonthNav
            monthLabel={screen.monthLabel}
            canGoPrev={screen.canGoPrev}
            canGoNext={screen.canGoNext}
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
