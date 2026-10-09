import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Illustration } from "@/shared/ui/Illustration";
import { PushNotice } from "@/shared/ui/PushNotice";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import {
  NOTIFICATION_PROMPT_BUTTON,
  PENDING_WAIT_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/pending/consts/pending.const";
import type { PendingScreenController } from "@/screens/pending/hooks/usePendingScreen";
import { PendingFooter } from "@/screens/pending/ui/PendingFooter";

export type PendingWaitingProps = {
  screen: PendingScreenController;
};

export function PendingWaiting({ screen }: PendingWaitingProps) {
  const insets = useSafeAreaInsets();

  return (
    <Screen
      floor="plain"
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-5"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="waiting" />
        <Badge
          variant="brand"
          size="md"
          dot
          label={PENDING_WAIT_COPY.waitingBadge}
        />
        <Text size="xl" weight="bold" className="mt-4 text-center">
          {PENDING_WAIT_COPY.waitingTitle}
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          {screen.rotatingLine}
        </Text>
      </View>

      <View>
        <PushNotice
          tone={screen.promptTone}
          title={screen.prompt.title}
          subline={screen.prompt.subline}
          action={
            screen.prompt.hasButton ? (
              <Button
                variant="primary"
                size="md"
                onPress={() => void screen.turnOnNotifications()}
              >
                {NOTIFICATION_PROMPT_BUTTON}
              </Button>
            ) : undefined
          }
        />
        <PendingFooter
          email={screen.email}
          photoUrl={screen.photoUrl}
          signingOut={screen.signingOut}
          signOutVariant="outline"
          onSignOut={() => screen.signOut(screen.goLogin)}
        />
      </View>
    </Screen>
  );
}
