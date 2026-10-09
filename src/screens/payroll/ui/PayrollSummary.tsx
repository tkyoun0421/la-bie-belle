import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { PAYROLL_COPY } from "@/screens/payroll/consts/payroll.const";
import type { PayrollScreenController } from "@/screens/payroll/hooks/usePayrollScreen";
import { PayrollAccrual } from "@/screens/payroll/ui/PayrollAccrual";

export type PayrollSummaryProps = {
  screen: PayrollScreenController;
};

export function PayrollSummary({ screen }: PayrollSummaryProps) {
  if (screen.loading) {
    return (
      <>
        <SkeletonLine className="mt-4 h-9 w-2/3" />

        <Text size="sm" tone="subtle" className="mt-1">
          {PAYROLL_COPY.estimateNote}
        </Text>
      </>
    );
  }

  return (
    <>
      <Text size="3xl" weight="bold" tone="brand" numeric className="mt-4">
        {screen.amountLabel}
      </Text>

      <Text size="sm" tone="subtle" className="mt-1">
        {PAYROLL_COPY.estimateNote}
      </Text>

      <PayrollAccrual accrual={screen.accrual} />
    </>
  );
}
