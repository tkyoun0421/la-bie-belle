import { ListRow } from "@/shared/ui/ListRow";
import type { PayrollHistoryRow } from "@/screens/payroll/utils/historyRows.utils";

export type PayrollHistoryRowsProps = {
  rows: readonly PayrollHistoryRow[];
};

export function PayrollHistoryRows({ rows }: PayrollHistoryRowsProps) {
  return (
    <>
      {rows.map((row, at) => (
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
