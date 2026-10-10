import type { ReactNode } from "react";
import { Text } from "@/shared/ui/Text";
import { usePayrollSummary } from "@/features/payrollCompute/hooks/usePayrollSummary";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { PayrollAccrual } from "@/features/payrollCompute/ui/PayrollAccrual";

export type PayrollSummaryProps = {
  span: DateSpan;
  pending?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
};

export function PayrollSummary({ span, pending, failed }: PayrollSummaryProps) {
  const fragment = usePayrollSummary(span);

  if (fragment.state === "failed") {
    return failed?.(fragment.retry) ?? null;
  }

  if (fragment.state === "pending") {
    return pending ?? null;
  }

  return (
    <>
      <Text size="3xl" weight="bold" tone="brand" numeric className="mt-4">
        {fragment.amountLabel}
      </Text>

      <Text size="sm" tone="subtle" className="mt-1">
        {fragment.estimateNote}
      </Text>

      <PayrollAccrual span={span} />
    </>
  );
}
