import { View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { useSkeletonShimmer } from "@/shared/hooks/useSkeletonShimmer";
import { cn } from "@/shared/utils/cn";

export type SkeletonProps = ViewProps & {
  testID?: string;
};

export function Skeleton({
  className,
  testID,
  onLayout,
  ...rest
}: SkeletonProps) {
  const shimmer = useSkeletonShimmer(onLayout);

  return (
    <View
      testID={testID}
      onLayout={shimmer.onLayout}
      className={cn("overflow-hidden rounded-xl bg-bg-neutral-weak", className)}
      {...rest}
    >
      {shimmer.showShimmer ? (
        <Animated.View
          testID={testID ? `${testID}-shimmer` : undefined}
          pointerEvents="none"
          style={[shimmer.shimmerStyle, { width: shimmer.shimmerWidth }]}
          className="absolute inset-y-0 left-0 bg-bg-neutral opacity-40"
        />
      ) : null}
    </View>
  );
}

export function SkeletonLine({ className, testID, ...rest }: SkeletonProps) {
  return (
    <Skeleton
      testID={testID}
      className={cn("h-5 rounded-sm bg-bg-neutral-weak-pressed", className)}
      {...rest}
    />
  );
}
