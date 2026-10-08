import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/utils/cn";

export type SkeletonProps = ViewProps & {
  reduceMotion?: boolean;
  testID?: string;
};

export function Skeleton({
  reduceMotion = false,
  className,
  testID,
  ...rest
}: SkeletonProps) {
  return (
    <View
      testID={testID}
      className={cn("overflow-hidden rounded-xl bg-bg-neutral-weak", className)}
      {...rest}
    >
      {reduceMotion ? null : (
        <View
          testID={testID ? `${testID}-shimmer` : undefined}
          className="h-full w-1/3 bg-bg-neutral opacity-40"
        />
      )}
    </View>
  );
}

export function SkeletonLine({
  reduceMotion = false,
  className,
  testID,
  ...rest
}: SkeletonProps) {
  return (
    <Skeleton
      reduceMotion={reduceMotion}
      testID={testID}
      className={cn("h-5 rounded-sm bg-bg-neutral-weak-pressed", className)}
      {...rest}
    />
  );
}
