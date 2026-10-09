import { SheetLayer } from "@/shared/ui/SheetLayer";
import { MemberDetailSheet } from "@/features/memberAdmin/ui/MemberDetailSheet";
import type { MembersPendingController } from "@/screens/membersPending/hooks/useMembersPendingScreen";

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
        profileId={screen.sheet.profileId}
        name={screen.sheet.name}
        photoUrl={screen.sheet.photoUrl}
        sentAt={screen.sheet.sentAt}
        values={screen.sheet.values}
        today={screen.today}
        onDone={screen.finish}
      />
    </SheetLayer>
  );
}
