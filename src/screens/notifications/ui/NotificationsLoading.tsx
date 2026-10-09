import { View } from "react-native";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { SKELETON_ROWS } from "@/screens/notifications/consts/notifications.const";

export function NotificationsLoading() {
  return (
    <View className="px-6 pt-4">
      {SKELETON_ROWS.map((at) => (
        <View key={at} className="h-14 flex-row items-center gap-3">
          <SkeletonLine className="flex-1" />
          <SkeletonLine className="w-12" />
        </View>
      ))}
    </View>
  );
}
