import { ScrollView, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { ROSTER_MAX_HEIGHT } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import type { RosterRow as RosterRowValue } from "@/screens/scheduleWorker/model/daySheet.policy";
import { DayRoster } from "@/screens/scheduleWorker/ui/DayRoster";

export type DaySheetProps = {
  title: string;
  subtitle: string;
  summaryLine?: string;
  rows: RosterRowValue[];
  myProfileId: string | null;
  myBadge?: string;
  showActions: boolean;
  actionsEnabled: boolean;
  onCancelShift: () => void;
  onRequestSwap: () => void;
};

export function DaySheet({
  title,
  subtitle,
  summaryLine,
  rows,
  myProfileId,
  myBadge,
  showActions,
  actionsEnabled,
  onCancelShift,
  onRequestSwap,
}: DaySheetProps) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text size="base" weight="semibold">
          {title}
        </Text>
        <Text size="xs" tone="subtle" numeric>
          {subtitle}
        </Text>
        {summaryLine === undefined ? null : (
          <Text size="xs" tone="subtle" numeric className="mt-2">
            {summaryLine}
          </Text>
        )}
      </View>

      <ScrollView style={{ maxHeight: ROSTER_MAX_HEIGHT }}>
        <DayRoster rows={rows} myProfileId={myProfileId} myBadge={myBadge} />
      </ScrollView>

      {showActions ? (
        <View className="flex-row gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!actionsEnabled}
            onPress={onCancelShift}
          >
            근무 취소
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!actionsEnabled}
            onPress={onRequestSwap}
          >
            교대 요청
          </Button>
        </View>
      ) : null}
    </View>
  );
}
