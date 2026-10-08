import { Image, View, type ViewProps } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

export type AvatarSize = 24 | 40 | 64 | 88;

const INITIAL_TEXT: Record<AvatarSize, string> = {
  24: "font-medium text-xs",
  40: "font-medium text-base",
  64: "font-semibold text-2xl",
  88: "font-semibold text-3xl",
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
