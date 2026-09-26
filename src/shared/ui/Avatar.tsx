import { Image, View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 사람 사진이 서는 원이다. 목록 줄 앞, 프로필 머리, 사람 픽커가 그 자리다.
 *
 * **사진이 없으면 이름 첫 글자다.** 「김민수」면 「김」이다. 옅은 브랜드 면 위 브랜드 글자고,
 * 옅은 브랜드 면이라 카드 안에서만 선다. 첫 글자가 같은 사람이 명단에 여럿이면 이 원이 사람을
 * 가르지 않는다 — 가르는 것은 옆 이름이고 원은 자리를 잡는 몫이다.
 *
 * **사진을 브랜드로 감싸지 않는다.** 테두리도 링도 없다. 사진 자체가 색을 갖고 있어 무엇을
 * 더해도 소음이다.
 *
 * 크기가 셋뿐인 것은 서는 자리가 셋이라서다 — 24는 목록 줄 앞과 배지 옆, 40은 ListRow의 왼쪽과
 * 사람 픽커, 64는 프로필 머리다. 글자 크기가 원 크기를 따라가므로 그 밖의 값은 못 받는다.
 */

export type AvatarSize = 24 | 40 | 64;

const INITIAL_TEXT: Record<AvatarSize, string> = {
  24: "font-medium text-xs",
  40: "font-medium text-base",
  64: "font-semibold text-2xl",
};

export type AvatarProps = ViewProps & {
  name: string;
  photoUrl?: string | null;
  size?: AvatarSize;
};

export function Avatar({
  name,
  photoUrl,
  size = 40,
  className,
  style,
  testID,
  ...rest
}: AvatarProps) {
  const initial = Array.from(name.trim())[0] ?? "";

  return (
    <View
      testID={testID}
      style={[style, { width: size, height: size }]}
      className={cn(
        "items-center justify-center overflow-hidden rounded-full bg-bg-brand-weak",
        className,
      )}
      {...rest}
    >
      {photoUrl ? (
        <Image
          testID={testID ? `${testID}-photo` : undefined}
          source={{ uri: photoUrl }}
          style={{ width: size, height: size }}
        />
      ) : (
        <Text className={cn("text-fg-brand", INITIAL_TEXT[size])}>
          {initial}
        </Text>
      )}
    </View>
  );
}
