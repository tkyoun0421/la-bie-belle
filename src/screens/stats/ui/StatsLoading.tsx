import { View } from "react-native";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { SKELETON_ROWS } from "@/screens/stats/consts/stats.const";

export function StatsLoading() {
  return (
    <View className="mt-6 gap-4">
      <SkeletonLine className="h-9 w-2/3" />
      {SKELETON_ROWS.map((at) => (
        <SkeletonLine key={at} className="w-2/3" />
      ))}
    </View>
  );
}
