import { Pressable, ScrollView, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import {
  DAY_SHEET_COPY,
  ROSTER_MAX_HEIGHT,
} from "@/entities/schedule/consts/daySheet.const";
import { useDaySheet } from "@/entities/schedule/hooks/useDaySheet";
import type { DaySheetInput } from "@/entities/schedule/model/daySheet.type";
import { DayRoster } from "@/entities/schedule/ui/DayRoster";

export type DaySheetProps = DaySheetInput;

function Loading() {
  return (
    <View className="gap-3">
      <SkeletonLine className="w-1/3" />
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-2/3" />
    </View>
  );
}

function Failed({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text size="sm" tone="subtle">
        {DAY_SHEET_COPY.failed}
      </Text>

      <Pressable onPress={onRetry} hitSlop={8}>
        <Text size="sm" weight="medium">
          {DAY_SHEET_COPY.retry}
        </Text>
      </Pressable>
    </View>
  );
}

export function DaySheet(props: DaySheetProps) {
  const sheet = useDaySheet(props);

  if (sheet.state === "loading") {
    return <Loading />;
  }

  if (sheet.state === "failed") {
    return <Failed onRetry={sheet.retry} />;
  }

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text size="base" weight="semibold">
          {sheet.title}
        </Text>
        <Text size="xs" tone="subtle" numeric>
          {sheet.subtitle}
        </Text>
      </View>

      <ScrollView style={{ maxHeight: ROSTER_MAX_HEIGHT }}>
        <DayRoster
          rows={sheet.rows}
          myProfileId={sheet.myProfileId}
          myBadge={sheet.myBadge}
        />
      </ScrollView>

      {sheet.showActions ? (
        <View className="flex-row gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!sheet.actionsEnabled}
            onPress={sheet.cancelShift}
          >
            {DAY_SHEET_COPY.cancelShift}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!sheet.actionsEnabled}
            onPress={sheet.requestSwap}
          >
            {DAY_SHEET_COPY.requestSwap}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
