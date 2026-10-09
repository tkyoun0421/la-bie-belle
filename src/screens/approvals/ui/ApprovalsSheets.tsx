import { SheetLayer } from "@/shared/ui/SheetLayer";
import type { ApprovalsScreenController } from "@/screens/approvals/hooks/useApprovalsScreen";
import { ApprovalDetailSheet } from "@/screens/approvals/ui/ApprovalDetailSheet";

export type ApprovalsSheetsProps = {
  screen: ApprovalsScreenController;
};

export function ApprovalsSheets({ screen }: ApprovalsSheetsProps) {
  if (screen.detail === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.closeSheet}>
      <ApprovalDetailSheet
        detail={screen.detail}
        face={screen.face}
        sending={screen.sending}
        failed={screen.failed}
        chosen={screen.chosen}
        written={screen.written}
        canSend={screen.canSend}
        sendLabel={screen.sendLabel}
        onFace={screen.showFace}
        onApprove={screen.askApprove}
        onChoose={screen.choose}
        onWrite={screen.write}
        onReject={screen.reject}
      />
    </SheetLayer>
  );
}
