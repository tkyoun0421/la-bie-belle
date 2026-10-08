import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/utils/cn";

export type QuoteBlockProps = ViewProps;

export function QuoteBlock({
  className,
  children,
  testID,
  ...rest
}: QuoteBlockProps) {
  return (
    <View
      testID={testID}
      className={cn("rounded-md bg-bg-neutral-weak p-4", className)}
      {...rest}
    >
      {children}
    </View>
  );
}
