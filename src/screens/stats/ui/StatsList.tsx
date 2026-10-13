import { FragmentView } from "@/shared/ui/FragmentView";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { PAYROLL_VIEW_SKELETON_ROWS } from "@/features/payrollCompute/consts/payrollCompute.const";
import { PayrollViewFailed } from "@/features/payrollCompute/ui/PayrollViewFailed";
import { StatsPayroll } from "@/features/payrollCompute/ui/StatsPayroll";
import { StatsAttendance } from "@/features/stats/ui/StatsAttendance";
import { StatsPositions } from "@/features/stats/ui/StatsPositions";
import { SKELETON_ROWS } from "@/screens/stats/consts/stats.const";
import type { StatsScreenController } from "@/screens/stats/hooks/useStatsScreen";
import { StatsEmpty } from "@/screens/stats/ui/StatsEmpty";
import { StatsFailed } from "@/screens/stats/ui/StatsFailed";

export type StatsListProps = {
  screen: StatsScreenController;
};

export function StatsList({ screen }: StatsListProps) {
  if (screen.tab === "attendance") {
    return (
      <StatsAttendance
        month={screen.month}
        pending={<SkeletonRows rows={SKELETON_ROWS} frame="headed" />}
        failed={<StatsFailed onRetry={screen.retry} />}
        empty={<StatsEmpty />}
      />
    );
  }

  if (screen.tab === "position") {
    return (
      <StatsPositions
        month={screen.month}
        pending={<SkeletonRows rows={SKELETON_ROWS} frame="headed" />}
        failed={<StatsFailed onRetry={screen.retry} />}
        empty={<StatsEmpty />}
      />
    );
  }

  return (
    <FragmentView
      fragment={screen.listState}
      pending={<SkeletonRows rows={SKELETON_ROWS} frame="headed" />}
      failed={<StatsFailed onRetry={screen.retry} />}
      empty={<StatsEmpty />}
    >
      {() => (
        <StatsPayroll
          span={screen.payrollSpan}
          onOpenHistory={screen.openPayrollHistory}
          pending={
            <SkeletonRows rows={PAYROLL_VIEW_SKELETON_ROWS} frame="bare" />
          }
          failed={(retry) => <PayrollViewFailed onRetry={retry} />}
        />
      )}
    </FragmentView>
  );
}
