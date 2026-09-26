import { Image, View, type ViewProps } from "react-native";
import { SvgUri } from "react-native-svg";

/**
 * 글자와 아이콘이 아닌 그림이다. 출처가 둘이라 조각도 둘이다 — `Illustration`은 AI로 뽑은 3D
 * 오브젝트(WebP)고 `Tossface`는 토스가 배포한 이모지(SVG)다.
 *
 * **두 디렉터리 다 비어 있을 수 있다.** 3D 열두 장은 승인을 거쳐 들어오고 토스페이스 스무 장은
 * `pnpm tossface:fetch`가 받아 오며 커밋되지 않는다. 그래서 두 조각 다 파일이 없으면 같은
 * 크기의 빈 자리를 남긴다 — 자리가 무너지면 그 화면의 레이아웃이 통째로 흔들린다.
 *
 * 파일을 `require.context`로 묶어 찾는 것은 Metro가 값이 정해지지 않은 `require`를 번들 단계에서
 * 거절하기 때문이다. `require.context`는 없는 디렉터리에서 빈 목록을 내주므로 번들이 서고, 없는
 * 파일을 부르면 그때 던지는 것을 여기서 받는다. 경로가 상대인 것은 `@/`가 `src/`만 가리켜
 * `assets/`에 못 닿아서다.
 *
 * **토스페이스 크기는 옆 글자를 따르지 않는다.** lucide 아이콘은 옆 글자 크기를 따르지만
 * 토스페이스는 면으로 그려진 그림이라 작게 그리면 뭉개진다. 카드 머리와 줄 앞이 같은 크기다.
 *
 * **다크 변형이 없다.** 배경이 투명한 오브젝트를 그대로 올리고 바닥 그림자는 없다. 토스페이스는
 * 파일이 든 색 그대로 서고 `fg` 토큰 밖이다.
 */

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

/**
 * 코드포인트는 원본 파일 이름 그대로다 — `u` 뒤에 대문자 열여섯 진수. 뜻으로 이름을 붙이면 어느
 * 원본에서 왔는지 대조가 끊기고, 뜻과 파일의 짝은
 * `docs/2-design/design-system/illustration.md`의 표가 든다.
 */

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
