import type { ReactNode } from "react";
import { View } from "react-native";
import { Divider } from "@/shared/ui/Divider";
import { Text } from "@/shared/ui/Text";
import { useWorkDaysSheet } from "@/features/stats/hooks/useWorkDaysSheet";

export type WorkDaysSheetProps = {
  month: string;
  profileId: string;
  pending: ReactNode;
  failed: ReactNode;
};

export function WorkDaysSheet({
  month,
  profileId,
  pending,
  failed,
}: WorkDaysSheetProps) {
  const fragment = useWorkDaysSheet(month, profileId);

  if (fragment.state === "pending") {
    return pending;
  }

  if (fragment.state === "failed") {
    return failed;
  }

  return (
    <View>
      <Text size="lg" weight="semibold">
        {fragment.name}
      </Text>

      <View className="mt-4">
        {fragment.rows.map((row) => (
          <View
            key={row.key}
            className="flex-row items-center justify-between py-3"
          >
            <Text size="sm" tone="muted">
              {row.title}
            </Text>
            <Text size="sm" numeric>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Divider className="mt-2" />

      <Text size="base" weight="medium" numeric className="mt-3">
        {fragment.total}
      </Text>
    </View>
  );
}
