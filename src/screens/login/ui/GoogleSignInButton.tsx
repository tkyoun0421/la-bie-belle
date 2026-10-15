import { Image, Platform, View } from "react-native";
import { SvgUri } from "react-native-svg";
import { PressScale } from "@/shared/ui/PressScale";
import {
  GOOGLE_BUTTON_ASPECT_RATIO,
  GOOGLE_BUTTON_ASSETS,
  LOGIN_COPY,
} from "@/screens/login/consts/login.const";

type AssetLookup = (key: string) => number;

function openGoogleAssets(): AssetLookup | null {
  try {
    return require.context("../../../../assets/google", false, /\.svg$/);
  } catch {
    return null;
  }
}

const googleAssets = openGoogleAssets();

function uriOf(name: string): string | null {
  if (googleAssets === null) {
    return null;
  }

  try {
    return Image.resolveAssetSource(googleAssets(`./${name}`))?.uri ?? null;
  } catch {
    return null;
  }
}

export type GoogleSignInButtonProps = {
  onPress: () => void;
  busy: boolean;
};

export function GoogleSignInButton({ onPress, busy }: GoogleSignInButtonProps) {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const assets = GOOGLE_BUTTON_ASSETS[platform];

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={LOGIN_COPY.googleLabel}
      disabled={busy}
      onPress={onPress}
      className="h-12"
      style={{ aspectRatio: GOOGLE_BUTTON_ASPECT_RATIO[platform] }}
    >
      <View className="size-full dark:hidden">
        <SvgUri uri={uriOf(assets.light)} width="100%" height="100%" />
      </View>
      <View className="hidden size-full dark:flex">
        <SvgUri uri={uriOf(assets.dark)} width="100%" height="100%" />
      </View>
    </PressScale>
  );
}
