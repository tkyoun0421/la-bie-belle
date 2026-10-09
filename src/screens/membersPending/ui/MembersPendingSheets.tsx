import { SheetLayer } from "@/shared/ui/SheetLayer";
import type { MembersPendingController } from "@/screens/membersPending/hooks/useMembersPendingScreen";
import { MemberDetailSheet } from "@/screens/membersPending/ui/MemberDetailSheet";

export type MembersPendingSheetsProps = {
  screen: MembersPendingController;
};

export function MembersPendingSheets({ screen }: MembersPendingSheetsProps) {
  if (screen.sheet === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.closeSheet}>
      <MemberDetailSheet
        name={screen.sheet.name}
        photoUrl={screen.sheet.photoUrl}
        sentAt={screen.sheet.sentAt}
        values={screen.sheet.values}
        today={screen.today}
        face={screen.face}
        failed={screen.failed}
        sending={screen.sending}
        onFace={screen.showFace}
        onApprove={screen.approve}
        onConfirm={screen.confirm}
      />
    </SheetLayer>
  );
}
