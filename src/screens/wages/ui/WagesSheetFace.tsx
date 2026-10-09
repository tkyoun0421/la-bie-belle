import { DefaultWageSheet } from "@/features/wageAdmin/ui/DefaultWageSheet";
import { MemberWageSheet } from "@/features/wageAdmin/ui/MemberWageSheet";
import type { WagesScreenController } from "@/screens/wages/hooks/useWagesScreen";

export type WagesSheetFaceProps = {
  screen: WagesScreenController;
};

export function WagesSheetFace({ screen }: WagesSheetFaceProps) {
  if (screen.sheet === "default") {
    return (
      <DefaultWageSheet
        defaultWage={screen.defaultWage}
        followerCount={screen.followerCount}
        onClose={screen.close}
        onDone={screen.finish}
      />
    );
  }

  if (screen.member === null) {
    return null;
  }

  return (
    <MemberWageSheet
      profileId={screen.member.profileId}
      name={screen.member.displayName}
      photoUrl={screen.member.photoUrl}
      rates={screen.member.rates}
      hasDefaultWage={screen.hasDefaultWage}
      defaultWage={screen.defaultWage}
      onClose={screen.close}
      onDone={screen.finish}
    />
  );
}
