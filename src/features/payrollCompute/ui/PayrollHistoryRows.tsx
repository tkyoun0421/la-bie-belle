import { ListRow } from "@/shared/ui/ListRow";
import { usePayrollHistoryRows } from "@/features/payrollCompute/hooks/usePayrollHistoryRows";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { PayrollViewFailed } from "@/features/payrollCompute/ui/PayrollViewFailed";
import { PayrollViewLoading } from "@/features/payrollCompute/ui/PayrollViewLoading";

export type PayrollHistoryRowsProps = {
  span: DateSpan;
};

export function PayrollHistoryRows({ span }: PayrollHistoryRowsProps) {
  const fragment = usePayrollHistoryRows(span);

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
          key={row.date}
          divider={at > 0}
          title={row.title}
          detail={row.subtitle}
          value={row.amountLabel}
        />
      ))}
    </>
  );
}
