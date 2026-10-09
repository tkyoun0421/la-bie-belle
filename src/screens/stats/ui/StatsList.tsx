import { StatsPayroll } from "@/features/payrollCompute/ui/StatsPayroll";
import { StatsAttendance } from "@/features/stats/ui/StatsAttendance";
import { StatsPositions } from "@/features/stats/ui/StatsPositions";
import type { StatsScreenController } from "@/screens/stats/hooks/useStatsScreen";
import { StatsEmpty } from "@/screens/stats/ui/StatsEmpty";
import { StatsFailed } from "@/screens/stats/ui/StatsFailed";
import { StatsLoading } from "@/screens/stats/ui/StatsLoading";

export type StatsListProps = {
  screen: StatsScreenController;
};

export function StatsList({ screen }: StatsListProps) {
  if (screen.tab === "attendance") {
    return (
      <StatsAttendance
        month={screen.month}
        loading={<StatsLoading />}
        failed={<StatsFailed onRetry={screen.retry} />}
        empty={<StatsEmpty />}
      />
    );
  }

  if (screen.tab === "position") {
    return (
      <StatsPositions
        month={screen.month}
        loading={<StatsLoading />}
        failed={<StatsFailed onRetry={screen.retry} />}
        empty={<StatsEmpty />}
      />
    );
  }

  if (screen.listState === "loading") {
    return <StatsLoading />;
  }

  if (screen.listState === "failed") {
    return <StatsFailed onRetry={screen.retry} />;
  }

  if (screen.listState === "empty") {
    return <StatsEmpty />;
  }

  return (
    <StatsPayroll
      span={screen.payrollSpan}
      onOpenHistory={screen.openPayrollHistory}
    />
  );
}
