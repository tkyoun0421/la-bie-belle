import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import {
  PENDING_WAIT_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/pending/consts/pending.const";
import type { PendingScreenController } from "@/screens/pending/hooks/usePendingScreen";
import { PendingFooter } from "@/screens/pending/ui/PendingFooter";

export type PendingRejectedProps = {
  screen: PendingScreenController;
};

export function PendingRejected({ screen }: PendingRejectedProps) {
  const insets = useSafeAreaInsets();

  return (
    <Screen
      floor="plain"
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-5"
    >
      <View className="flex-1 items-center justify-center">
        <Badge
          variant="neutral"
          size="md"
          label={PENDING_WAIT_COPY.rejectedBadge}
        />
        <Text size="xl" weight="bold" className="mt-4 text-center">
          {PENDING_WAIT_COPY.rejectedTitle}
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          {PENDING_WAIT_COPY.rejectedSubline}
        </Text>
      </View>

      <View>
        <PendingFooter
          email={screen.email}
          photoUrl={screen.photoUrl}
          signingOut={screen.signingOut}
          signOutVariant="ghost"
          onSignOut={screen.leave}
        >
          <Button variant="primary" className="mt-4" onPress={screen.retry}>
            {PENDING_WAIT_COPY.retry}
          </Button>
        </PendingFooter>
      </View>
    </Screen>
  );
}
