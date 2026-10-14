import { View, type ViewProps } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

export type BrandMarkProps = ViewProps & {
  glyph: string;
};

export function BrandMark({ glyph, className, ...rest }: BrandMarkProps) {
  return (
    <View
      className={cn(
        "size-12 items-center justify-center rounded-lg bg-bg-brand-solid",
        className,
      )}
      {...rest}
    >
      <Text size="lg" weight="bold" className="text-fg-brand-contrast">
        {glyph}
      </Text>
    </View>
  );
}
