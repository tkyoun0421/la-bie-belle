import type { PayrollScreenController } from "@/screens/payroll/hooks/usePayrollScreen";
import { PayrollEmpty } from "@/screens/payroll/ui/PayrollEmpty";
import { PayrollFailed } from "@/screens/payroll/ui/PayrollFailed";
import { PayrollHistoryRows } from "@/screens/payroll/ui/PayrollHistoryRows";
import { PayrollLoading } from "@/screens/payroll/ui/PayrollLoading";
import { PayrollMonthRows } from "@/screens/payroll/ui/PayrollMonthRows";

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
        rows={screen.monthRows}
        onOpenMonth={screen.openMonth}
      />
    );
  }

  return <PayrollHistoryRows rows={screen.historyRows} />;
}
