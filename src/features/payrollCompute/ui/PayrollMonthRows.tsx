import type { ReactNode } from "react";
import { ListRow } from "@/shared/ui/ListRow";
import { usePayrollMonthRows } from "@/features/payrollCompute/hooks/usePayrollMonthRows";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";

export type PayrollMonthRowsProps = {
  span: DateSpan;
  onOpenMonth: (month: string) => void;
  pending?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
};

export function PayrollMonthRows({
  span,
  onOpenMonth,
  pending,
  failed,
}: PayrollMonthRowsProps) {
  const fragment = usePayrollMonthRows({ span, onOpenMonth });

  if (fragment.state === "pending") {
    return pending ?? null;
  }

  if (fragment.state === "failed") {
    return failed?.(fragment.retry) ?? null;
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
