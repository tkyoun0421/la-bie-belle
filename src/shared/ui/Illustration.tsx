import { Image, View, type ViewProps } from "react-native";
import { SvgUri } from "react-native-svg";

const SCENE_SIZE = { large: 240, small: 120 } as const;

const TOSSFACE_SIZE = 24;

type AssetLookup = (key: string) => number;

function openAssets(load: () => AssetLookup): AssetLookup | null {
  try {
    return load();
  } catch {
    return null;
  }
}

function assetOf(lookup: AssetLookup | null, key: string): number | null {
  if (lookup === null) {
    return null;
  }

  try {
    return lookup(key);
  } catch {
    return null;
  }
}

const scenes = openAssets(
  () =>
    require.context(
      "../../../assets/illustrations",
      false,
      /\.webp$/,
    ) as unknown as AssetLookup,
);

const tossfaces = openAssets(
  () =>
    require.context(
      "../../../assets/tossface",
      false,
      /\.svg$/,
    ) as unknown as AssetLookup,
);

export type IllustrationScene =
  | "no-schedule"
  | "no-shifts"
  | "no-applications"
  | "all-clear"
  | "no-notifications"
  | "no-members"
  | "waiting"
  | "farewell"
  | "blocked"
  | "location-off"
  | "server-error"
  | "offline";

export type IllustrationSize = keyof typeof SCENE_SIZE;

export type IllustrationProps = ViewProps & {
  scene: IllustrationScene;
  size?: IllustrationSize;
};

export function Illustration({
  scene,
  size = "large",
  className,
  style,
  testID,
  ...rest
}: IllustrationProps) {
  const side = SCENE_SIZE[size];
  const source = assetOf(scenes, `./${scene}.webp`);

  return (
    <View
      testID={testID}
      style={[style, { width: side, height: side }]}
      className={className}
      {...rest}
    >
      {source === null ? null : (
        <Image
          testID={testID ? `${testID}-image` : undefined}
          source={source}
          style={{ width: side, height: side }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

export type TossfaceCodepoint =
  | "23F0"
  | "1F317"
  | "1F44B"
  | "1F465"
  | "1F48D"
  | "1F492"
  | "1F4B0"
  | "1F4C5"
  | "1F4CA"
  | "1F4CB"
  | "1F4DD"
  | "1F4DE"
  | "1F4E2"
  | "1F4EE"
  | "1F4F1"
  | "1F501"
  | "1F511"
  | "1F514"
  | "1F64B"
  | "1FAAA";

export type TossfaceProps = ViewProps & {
  codepoint: TossfaceCodepoint;
};

export function Tossface({
  codepoint,
  className,
  style,
  testID,
  ...rest
}: TossfaceProps) {
  const source = assetOf(tossfaces, `./u${codepoint}.svg`);
  const uri =
    source === null ? null : (Image.resolveAssetSource(source)?.uri ?? null);

  return (
    <View
      testID={testID}
      style={[style, { width: TOSSFACE_SIZE, height: TOSSFACE_SIZE }]}
      className={className}
      {...rest}
    >
      <SvgUri uri={uri} width={TOSSFACE_SIZE} height={TOSSFACE_SIZE} />
    </View>
  );
}
