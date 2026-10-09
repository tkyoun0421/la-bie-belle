import { ListRow } from "@/shared/ui/ListRow";
import { usePayrollMonthRows } from "@/features/payrollCompute/hooks/usePayrollMonthRows";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { PayrollViewFailed } from "@/features/payrollCompute/ui/PayrollViewFailed";
import { PayrollViewLoading } from "@/features/payrollCompute/ui/PayrollViewLoading";

export type PayrollMonthRowsProps = {
  span: DateSpan;
  onOpenMonth: (month: string) => void;
};

export function PayrollMonthRows({ span, onOpenMonth }: PayrollMonthRowsProps) {
  const fragment = usePayrollMonthRows({ span, onOpenMonth });

  if (fragment.state === "pending") {
    return <PayrollViewLoading />;
  }

  if (fragment.state === "failed") {
    return <PayrollViewFailed onRetry={fragment.retry} />;
  }

  return (
    <>
      {fragment.rows.map((row, at) => (
        <ListRow
          key={row.key}
          divider={at > 0}
          title={row.title}
          value={row.amountLabel}
          onPress={row.press}
        />
      ))}
    </>
  );
}
