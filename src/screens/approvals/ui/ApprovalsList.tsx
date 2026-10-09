import type { ApprovalsScreenController } from "@/screens/approvals/hooks/useApprovalsScreen";
import { ApprovalRows } from "@/screens/approvals/ui/ApprovalRows";
import { ApprovalsEmpty } from "@/screens/approvals/ui/ApprovalsEmpty";
import { ApprovalsLoading } from "@/screens/approvals/ui/ApprovalsLoading";

export type ApprovalsListProps = {
  screen: ApprovalsScreenController;
};

export function ApprovalsList({ screen }: ApprovalsListProps) {
  if (screen.listState === "loading") {
    return <ApprovalsLoading />;
  }

  if (screen.listState === "empty") {
    return <ApprovalsEmpty />;
  }

  return <ApprovalRows rows={screen.rows} />;
}
