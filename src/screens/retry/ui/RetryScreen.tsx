import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { Illustration } from "@/shared/ui/Illustration";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import {
  RETRY_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/retry/consts/retry.const";
import { useRetryScreen } from "@/screens/retry/hooks/useRetryScreen";

export function RetryScreen() {
  const insets = useSafeAreaInsets();
  const screen = useRetryScreen();

  return (
    <Screen
      floor="plain"
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-5"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="server-error" />
        <Text size="xl" weight="semibold" className="text-center">
          {RETRY_COPY.title}
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          {RETRY_COPY.body}
        </Text>
        <Button
          variant="primary"
          className="mt-8 self-stretch"
          loading={screen.retrying}
          onPress={screen.retry}
        >
          {RETRY_COPY.retry}
        </Button>
      </View>

      <View>
        <Divider className="my-5" />
        <View className="flex-row items-center justify-center gap-3">
          <Avatar name={screen.email} photoUrl={screen.photoUrl} size={24} />
          <Text size="sm" tone="subtle">
            {screen.email}
          </Text>
        </View>
        <Button
          variant="ghost"
          className="mt-4"
          loading={screen.signingOut}
          onPress={() => screen.signOut(screen.goLogin)}
        >
          {RETRY_COPY.signOut}
        </Button>
      </View>
    </Screen>
  );
}
