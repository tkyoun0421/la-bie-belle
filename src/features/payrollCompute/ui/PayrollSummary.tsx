import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { usePayrollSummary } from "@/features/payrollCompute/hooks/usePayrollSummary";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { PayrollAccrual } from "@/features/payrollCompute/ui/PayrollAccrual";
import { PayrollViewFailed } from "@/features/payrollCompute/ui/PayrollViewFailed";

export type PayrollSummaryProps = {
  span: DateSpan;
};

export function PayrollSummary({ span }: PayrollSummaryProps) {
  const fragment = usePayrollSummary(span);

  if (fragment.state === "failed") {
    return <PayrollViewFailed onRetry={fragment.retry} />;
  }

  if (fragment.state === "pending") {
    return (
      <>
        <SkeletonLine className="mt-4 h-9 w-2/3" />

        <Text size="sm" tone="subtle" className="mt-1">
          {fragment.estimateNote}
        </Text>
      </>
    );
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
