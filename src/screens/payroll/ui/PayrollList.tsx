import { FragmentView } from "@/shared/ui/FragmentView";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { PAYROLL_VIEW_SKELETON_ROWS } from "@/features/payrollCompute/consts/payrollCompute.const";
import { PayrollHistoryRows } from "@/features/payrollCompute/ui/PayrollHistoryRows";
import { PayrollMonthRows } from "@/features/payrollCompute/ui/PayrollMonthRows";
import { PayrollViewFailed } from "@/features/payrollCompute/ui/PayrollViewFailed";
import type { PayrollScreenController } from "@/screens/payroll/hooks/usePayrollScreen";
import { PayrollEmpty } from "@/screens/payroll/ui/PayrollEmpty";
import { PayrollFailed } from "@/screens/payroll/ui/PayrollFailed";
import { PayrollLoading } from "@/screens/payroll/ui/PayrollLoading";

export type PayrollListProps = {
  screen: PayrollScreenController;
};

export function PayrollList({ screen }: PayrollListProps) {
  const { profileId } = screen;

  if (profileId === null) {
    return <PayrollLoading />;
  }

  return (
    <FragmentView
      fragment={screen.listState}
      pending={<PayrollLoading />}
      failed={<PayrollFailed onRetry={screen.retry} />}
      empty={<PayrollEmpty />}
    >
      {(ready) =>
        ready.view === "months" ? (
          <PayrollMonthRows
            span={screen.span}
            profileId={profileId}
            onOpenMonth={screen.openMonth}
            pending={
              <SkeletonRows rows={PAYROLL_VIEW_SKELETON_ROWS} frame="bare" />
            }
            failed={(retry) => <PayrollViewFailed onRetry={retry} />}
            empty={<PayrollEmpty />}
          />
        ) : (
          <PayrollHistoryRows
            span={screen.span}
            profileId={profileId}
            pending={
              <SkeletonRows rows={PAYROLL_VIEW_SKELETON_ROWS} frame="bare" />
            }
            failed={(retry) => <PayrollViewFailed onRetry={retry} />}
            empty={<PayrollEmpty />}
          />
        )
      }
    </FragmentView>
  );
}
