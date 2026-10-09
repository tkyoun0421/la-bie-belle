import { View } from "react-native";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { SKELETON_ROWS } from "@/screens/profile/consts/profile.const";

export function ProfileFactsLoading() {
  return (
    <View className="mt-6">
      {SKELETON_ROWS.map((at) => (
        <SkeletonLine key={at} className="my-4 w-2/3" />
      ))}
    </View>
  );
}
