import { EmptyState } from "@/shared/ui/EmptyState";
import { PAYROLL_COPY } from "@/screens/payroll/consts/payroll.const";

export function PayrollEmpty() {
  return (
    <EmptyState
      scene="no-shifts"
      title={PAYROLL_COPY.emptyTitle}
      description={PAYROLL_COPY.emptyBody}
    />
  );
}
