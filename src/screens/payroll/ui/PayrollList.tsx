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
  if (screen.listState === "loading") {
    return <PayrollLoading />;
  }

  if (screen.listState === "failed") {
    return <PayrollFailed onRetry={screen.retry} />;
  }

  if (screen.listState === "empty") {
    return <PayrollEmpty />;
  }

  if (screen.listState === "months") {
    return (
      <PayrollMonthRows
        span={screen.span}
        onOpenMonth={screen.openMonth}
        pending={<PayrollViewLoading />}
        failed={(retry) => <PayrollViewFailed onRetry={retry} />}
      />
    );
  }

  return (
    <PayrollHistoryRows
      span={screen.span}
      pending={<PayrollViewLoading />}
      failed={(retry) => <PayrollViewFailed onRetry={retry} />}
    />
  );
}
