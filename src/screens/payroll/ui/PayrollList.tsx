import { FragmentView } from "@/shared/ui/FragmentView";
import { PayrollHistoryRows } from "@/features/payrollCompute/ui/PayrollHistoryRows";
import { PayrollMonthRows } from "@/features/payrollCompute/ui/PayrollMonthRows";
import { PayrollViewFailed } from "@/features/payrollCompute/ui/PayrollViewFailed";
import { PayrollViewLoading } from "@/features/payrollCompute/ui/PayrollViewLoading";
import type { PayrollScreenController } from "@/screens/payroll/hooks/usePayrollScreen";
import { PayrollEmpty } from "@/screens/payroll/ui/PayrollEmpty";
import { PayrollFailed } from "@/screens/payroll/ui/PayrollFailed";
import { PayrollLoading } from "@/screens/payroll/ui/PayrollLoading";

export type PayrollListProps = {
  screen: PayrollScreenController;
};

export function PayrollList({ screen }: PayrollListProps) {
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
            onOpenMonth={screen.openMonth}
            pending={<PayrollViewLoading />}
            failed={(retry) => <PayrollViewFailed onRetry={retry} />}
            empty={<PayrollEmpty />}
          />
        ) : (
          <PayrollHistoryRows
            span={screen.span}
            pending={<PayrollViewLoading />}
            failed={(retry) => <PayrollViewFailed onRetry={retry} />}
            empty={<PayrollEmpty />}
          />
        )
      }
    </FragmentView>
  );
}
