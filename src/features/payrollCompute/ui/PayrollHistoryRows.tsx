import type { ReactNode } from "react";
import { ListRow } from "@/shared/ui/ListRow";
import { usePayrollHistoryRows } from "@/features/payrollCompute/hooks/usePayrollHistoryRows";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";

export type PayrollHistoryRowsProps = {
  span: DateSpan;
  pending?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
  empty?: ReactNode;
};

export function PayrollHistoryRows({
  span,
  pending,
  failed,
  empty,
}: PayrollHistoryRowsProps) {
  const fragment = usePayrollHistoryRows(span);

  if (fragment.state === "pending") {
    return pending ?? null;
  }

  if (fragment.state === "failed") {
    return failed?.(fragment.retry) ?? null;
  }

  if (fragment.state === "empty") {
    return empty ?? null;
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
