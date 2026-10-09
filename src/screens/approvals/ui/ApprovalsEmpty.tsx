import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { APPROVALS_COPY } from "@/screens/approvals/consts/approvals.const";

export function ApprovalsEmpty() {
  return (
    <Card>
      <EmptyState
        scene="all-clear"
        title={APPROVALS_COPY.emptyTitle}
        description={APPROVALS_COPY.emptyBody}
      />
    </Card>
  );
}
