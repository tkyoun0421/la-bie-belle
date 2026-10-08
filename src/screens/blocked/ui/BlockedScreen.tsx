import { useRouter } from "expo-router";
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { me, signOut, isPending } = useBlockedScreen();

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
          <Avatar
            name={me?.email ?? ""}
            photoUrl={me?.googlePhotoUrl ?? null}
            size={24}
          />
          <Text size="sm" tone="subtle">
            {me?.email ?? ""}
          </Text>
        </View>
        <Button
          variant="ghost"
          className="mt-4"
          loading={isPending}
          onPress={() => signOut(() => router.replace("/login"))}
        >
          {BLOCKED_COPY.signOut}
        </Button>
      </View>
    </Screen>
  );
}
