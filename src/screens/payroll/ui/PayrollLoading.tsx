import { View } from "react-native";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { SKELETON_ROWS } from "@/screens/payroll/consts/payroll.const";

export function PayrollLoading() {
  return (
    <View className="gap-4">
      {SKELETON_ROWS.map((at) => (
        <SkeletonLine key={at} className="w-2/3" />
      ))}
    </View>
  );
}
