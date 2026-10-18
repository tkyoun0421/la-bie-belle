import type { ReactNode } from "react";
import { FragmentView } from "@/shared/ui/FragmentView";
import { Text } from "@/shared/ui/Text";
import { usePayrollSummary } from "@/features/payrollCompute/hooks/usePayrollSummary";
import type { DateSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import { PayrollAccrual } from "@/features/payrollCompute/ui/PayrollAccrual";

export type PayrollSummaryProps = {
  span: DateSpan;
  profileId: string;
  pending?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
};

export function PayrollSummary({
  span,
  profileId,
  pending,
  failed,
}: PayrollSummaryProps) {
  const fragment = usePayrollSummary(span, profileId);

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={(branch) => failed?.(branch.retry)}
    >
      {(ready) => (
        <>
          <Text size="3xl" weight="bold" tone="brand" numeric className="mt-4">
            {ready.amountLabel}
          </Text>

          <Text size="sm" tone="subtle" className="mt-1">
            {ready.estimateNote}
          </Text>

          <PayrollAccrual span={span} profileId={profileId} />
        </>
      )}
    </FragmentView>
  );
}
