import { StatsPayroll } from "@/features/payrollCompute/ui/StatsPayroll";
import type { StatsScreenController } from "@/screens/stats/hooks/useStatsScreen";
import { StatsAttendance } from "@/screens/stats/ui/StatsAttendance";
import { StatsEmpty } from "@/screens/stats/ui/StatsEmpty";
import { StatsFailed } from "@/screens/stats/ui/StatsFailed";
import { StatsLoading } from "@/screens/stats/ui/StatsLoading";
import { StatsPositions } from "@/screens/stats/ui/StatsPositions";

export type StatsListProps = {
  screen: StatsScreenController;
};

export function StatsList({ screen }: StatsListProps) {
  if (screen.listState === "loading") {
    return <StatsLoading />;
  }

  if (screen.listState === "failed") {
    return <StatsFailed onRetry={screen.retry} />;
  }

  if (screen.listState === "empty") {
    return <StatsEmpty />;
  }

  if (screen.listState === "attendance") {
    return (
      <StatsAttendance
        line={screen.attendanceLine}
        shares={screen.shares}
        rows={screen.attendanceRows}
      />
    );
  }

  if (screen.listState === "position") {
    return (
      <StatsPositions
        totalLabel={screen.totalLabel}
        rows={screen.positionRows}
      />
    );
  }

  return (
    <StatsPayroll
      span={screen.payrollSpan}
      onOpenHistory={screen.openPayrollHistory}
    />
  );
}
