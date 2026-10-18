import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_UNAVAILABLE_COPY } from "@/shared/consts/appUnavailable.const";
import { SCREEN_BOTTOM_PADDING } from "@/shared/consts/layout.const";
import { Illustration } from "@/shared/ui/Illustration";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";

export function AppUnavailable() {
  const insets = useSafeAreaInsets();

  return (
    <Screen
      floor="plain"
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-5"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="server-error" />
        <Text size="xl" weight="semibold" className="text-center">
          {APP_UNAVAILABLE_COPY.title}
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          {APP_UNAVAILABLE_COPY.body}
        </Text>
      </View>
    </Screen>
  );
}
