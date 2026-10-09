import type { WagesScreenController } from "@/screens/wages/hooks/useWagesScreen";
import { DefaultWageSheet } from "@/screens/wages/ui/DefaultWageSheet";
import { MemberWageSheet } from "@/screens/wages/ui/MemberWageSheet";

export type WagesSheetFaceProps = {
  screen: WagesScreenController;
};

export function WagesSheetFace({ screen }: WagesSheetFaceProps) {
  if (screen.sheet === "default") {
    return (
      <DefaultWageSheet
        followerLine={screen.followerLine}
        amountText={screen.amountText}
        capHint={screen.capHint}
        canSave={screen.canSave}
        sending={screen.sending}
        failed={screen.failed}
        onDigits={screen.write}
        onClose={screen.close}
        onSave={screen.save}
      />
    );
  }

  if (screen.member === null) {
    return null;
  }

  return (
    <MemberWageSheet
      name={screen.member.displayName}
      photoUrl={screen.member.photoUrl}
      historyRows={screen.historyRows}
      historyHasMore={screen.historyHasMore}
      amountText={screen.amountText}
      capHint={screen.capHint}
      canSave={screen.canSave}
      canReset={screen.canReset}
      sending={screen.sending}
      failed={screen.failed}
      onDigits={screen.write}
      onExpand={screen.expandHistory}
      onReset={screen.askReset}
      onClose={screen.close}
      onSave={screen.save}
    />
  );
}
