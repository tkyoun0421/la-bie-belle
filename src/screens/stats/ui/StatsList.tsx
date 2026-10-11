import { FragmentView } from "@/shared/ui/FragmentView";
import { PayrollViewFailed } from "@/features/payrollCompute/ui/PayrollViewFailed";
import { PayrollViewLoading } from "@/features/payrollCompute/ui/PayrollViewLoading";
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
        pending={<StatsLoading />}
        failed={<StatsFailed onRetry={screen.retry} />}
        empty={<StatsEmpty />}
      />
    );
  }

  if (screen.tab === "position") {
    return (
      <StatsPositions
        month={screen.month}
        pending={<StatsLoading />}
        failed={<StatsFailed onRetry={screen.retry} />}
        empty={<StatsEmpty />}
      />
    );
  }

  return (
    <FragmentView
      fragment={screen.listState}
      pending={<StatsLoading />}
      failed={<StatsFailed onRetry={screen.retry} />}
      empty={<StatsEmpty />}
    >
      {() => (
        <StatsPayroll
          span={screen.payrollSpan}
          onOpenHistory={screen.openPayrollHistory}
          pending={<PayrollViewLoading />}
          failed={(retry) => <PayrollViewFailed onRetry={retry} />}
        />
      )}
    </FragmentView>
  );
}
