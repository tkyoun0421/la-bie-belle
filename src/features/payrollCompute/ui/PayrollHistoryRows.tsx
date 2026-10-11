import type { ReactNode } from "react";
import { FragmentView } from "@/shared/ui/FragmentView";
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

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={(branch) => failed?.(branch.retry)}
      empty={empty}
    >
      {(ready) =>
        ready.rows.map((row, at) => (
          <ListRow
            key={row.date}
            divider={at > 0}
            title={row.title}
            detail={row.subtitle}
            value={row.amountLabel}
          />
        ))
      }
    </FragmentView>
  );
}
