import { ListRow } from "@/shared/ui/ListRow";
import { PAYROLL_COPY } from "@/screens/payroll/consts/payroll.const";
import type { PayrollYearRow } from "@/screens/payroll/utils/yearRows.utils";

export type PayrollMonthRowsProps = {
  rows: readonly PayrollYearRow[];
  onOpenMonth: (month: string) => void;
};

export function PayrollMonthRows({ rows, onOpenMonth }: PayrollMonthRowsProps) {
  return (
    <>
      {rows.map((row, at) =>
        row.type === "month" ? (
          <ListRow
            key={row.month}
            divider={at > 0}
            title={row.title}
            value={row.amountLabel}
            onPress={() => onOpenMonth(row.month)}
          />
        ) : (
          <ListRow
            key="total"
            divider={at > 0}
            title={PAYROLL_COPY.totalTitle}
            value={row.amountLabel}
          />
        ),
      )}
    </>
  );
}
