import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { TrendChart } from "@/shared/ui/TrendChart";
import { StatsMonthNav } from "@/features/stats/ui/StatsMonthNav";
import { STATS_COPY, TAB_OPTIONS } from "@/screens/stats/consts/stats.const";
import { useStatsScreen } from "@/screens/stats/hooks/useStatsScreen";
import { StatsList } from "@/screens/stats/ui/StatsList";

export function StatsScreen() {
  const screen = useStatsScreen();

  return (
    <Screen floor="plain">
      <AppBar title={STATS_COPY.appBarTitle} onBack={screen.goBack} />

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

          <StatsList screen={screen} />
        </View>
      </ScrollView>
    </Screen>
  );
}
