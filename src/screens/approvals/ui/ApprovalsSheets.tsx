import { SheetLayer } from "@/shared/ui/SheetLayer";
import { ApprovalDetailSheet } from "@/features/workRequest/ui/ApprovalDetailSheet";
import type { ApprovalsScreenController } from "@/screens/approvals/hooks/useApprovalsScreen";

export type ApprovalsSheetsProps = {
  screen: ApprovalsScreenController;
};

export function ApprovalsSheets({ screen }: ApprovalsSheetsProps) {
  if (screen.sheet === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.closeSheet}>
      <ApprovalDetailSheet
        approval={screen.sheet}
        onRejected={screen.finishReject}
        onApproved={screen.finishApprove}
      />
    </SheetLayer>
  );
}
