import { View, type ViewProps } from "react-native";
import { Illustration, type IllustrationScene } from "@/shared/ui/Illustration";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

export type EmptyStateProps = Omit<ViewProps, "children"> & {
  scene: IllustrationScene;
  title?: string;
  description: string;
  testID?: string;
};

export function EmptyState({
  scene,
  title,
  description,
  className,
  testID,
  ...rest
}: EmptyStateProps) {
  return (
    <View
      testID={testID}
      className={cn("items-center gap-4 py-6", className)}
      {...rest}
    >
      <Illustration scene={scene} size="small" />
      <View className="items-center">
        {title ? (
          <Text className="text-center font-medium text-base text-fg-neutral">
            {title}
          </Text>
        ) : null}
        <Text
          className={cn(
            "text-center text-sm text-fg-neutral-subtle",
            title && "mt-0.5",
          )}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
