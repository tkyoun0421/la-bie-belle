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
  RETRY_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/retry/consts/retry.const";
import { useRetryScreen } from "@/screens/retry/hooks/useRetryScreen";

export function RetryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { me, retry, retrying, signOut, signingOut } = useRetryScreen(router);

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
          loading={retrying}
          onPress={retry}
        >
          {RETRY_COPY.retry}
        </Button>
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
          loading={signingOut}
          onPress={() => signOut(() => router.replace("/login"))}
        >
          {RETRY_COPY.signOut}
        </Button>
      </View>
    </Screen>
  );
}
