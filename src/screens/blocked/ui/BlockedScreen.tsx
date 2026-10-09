import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { Illustration } from "@/shared/ui/Illustration";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import {
  BLOCKED_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/blocked/consts/blocked.const";
import { useBlockedScreen } from "@/screens/blocked/hooks/useBlockedScreen";

export function BlockedScreen() {
  const insets = useSafeAreaInsets();
  const screen = useBlockedScreen();

  return (
    <Screen
      floor="plain"
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-5"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="blocked" />
        <Text size="xl" weight="semibold" className="text-center">
          {BLOCKED_COPY.title}
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          {BLOCKED_COPY.body}
        </Text>
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
          loading={screen.isPending}
          onPress={() => screen.signOut(screen.goLogin)}
        >
          {BLOCKED_COPY.signOut}
        </Button>
      </View>
    </Screen>
  );
}
