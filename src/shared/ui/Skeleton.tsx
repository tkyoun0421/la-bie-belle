import { View, type ViewProps } from "react-native";
import { useReduceMotion } from "@/shared/hooks/useReduceMotion";
import { cn } from "@/shared/utils/cn";

export type SkeletonProps = ViewProps & {
  testID?: string;
};

export function Skeleton({ className, testID, ...rest }: SkeletonProps) {
  const reduceMotion = useReduceMotion();

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

export function SkeletonLine({ className, testID, ...rest }: SkeletonProps) {
  return (
    <Skeleton
      testID={testID}
      className={cn("h-5 rounded-sm bg-bg-neutral-weak-pressed", className)}
      {...rest}
    />
  );
}
