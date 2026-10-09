import { CelebrationCircle } from "@/shared/ui/CelebrationCircle";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import type { PendingScreenController } from "@/screens/pending/hooks/usePendingScreen";

export type PendingCelebrationProps = {
  screen: PendingScreenController;
};

export function PendingCelebration({ screen }: PendingCelebrationProps) {
  return (
    <Screen floor="plain" className="items-center justify-center px-5">
      <CelebrationCircle name={screen.name} photoUrl={screen.photoUrl} />
      <Text size="2xl" weight="semibold" className="mt-6">
        {screen.nameLine}
      </Text>
    </Screen>
  );
}
