import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREEN_BOTTOM_PADDING } from "@/shared/consts/layout.const";
import { BrandMark } from "@/shared/ui/BrandMark";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import { LOGIN_COPY } from "@/screens/login/consts/login.const";
import { useLoginScreen } from "@/screens/login/hooks/useLoginScreen";
import { GoogleSignInButton } from "@/screens/login/ui/GoogleSignInButton";
import { LoginNotice } from "@/screens/login/ui/LoginNotice";

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const screen = useLoginScreen();

  return (
    <Screen
      floor="plain"
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-5"
    >
      <View className="flex-1 items-center justify-center">
        <BrandMark glyph={LOGIN_COPY.brandMark} className="mb-5" />
        <Text size="2xl" weight="bold" className="text-center">
          {LOGIN_COPY.serviceName}
        </Text>
        <Text size="sm" tone="subtle" className="mt-2 text-center">
          {LOGIN_COPY.tagline}
        </Text>
      </View>

      <View className="items-center">
        <GoogleSignInButton onPress={screen.signIn} busy={screen.busy} />
        <LoginNotice failed={screen.failed} />
      </View>
    </Screen>
  );
}
