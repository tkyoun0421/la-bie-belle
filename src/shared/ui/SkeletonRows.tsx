import { View } from "react-native";
import { Card } from "@/shared/ui/Card";
import { SkeletonLine } from "@/shared/ui/Skeleton";

export type SkeletonRowsFrame = "card" | "headed" | "bare";

export type SkeletonRowsProps = {
  rows: readonly number[];
  frame: SkeletonRowsFrame;
};

export function SkeletonRows({ rows, frame }: SkeletonRowsProps) {
  if (frame === "headed") {
    return (
      <View className="mt-6 gap-4">
        <SkeletonLine className="h-9 w-2/3" />
        {rows.map((at) => (
          <SkeletonLine key={at} className="w-2/3" />
        ))}
      </View>
    );
  }

  const lines = rows.map((at) => (
    <SkeletonLine key={at} className="my-4 w-2/3" />
  ));

  return frame === "card" ? <Card>{lines}</Card> : <>{lines}</>;
}
