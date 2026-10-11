import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { FragmentView } from "@/shared/ui/FragmentView";
import { Text } from "@/shared/ui/Text";
import {
  DAY_SHEET_COPY,
  ROSTER_MAX_HEIGHT,
} from "@/entities/schedule/consts/daySheet.const";
import { useDaySheet } from "@/entities/schedule/hooks/useDaySheet";
import type { DaySheetInput } from "@/entities/schedule/model/daySheet.type";
import { DayRoster } from "@/entities/schedule/ui/DayRoster";

export type DaySheetProps = DaySheetInput & {
  pending?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
};

export function DaySheet({ pending, failed, ...input }: DaySheetProps) {
  const sheet = useDaySheet(input);

  return (
    <FragmentView
      fragment={sheet}
      pending={pending}
      failed={(branch) => failed?.(branch.retry)}
    >
      {(ready) => (
        <View className="gap-3">
          <View className="gap-1">
            <Text size="base" weight="semibold">
              {ready.title}
            </Text>
            <Text size="xs" tone="subtle" numeric>
              {ready.subtitle}
            </Text>
          </View>

          <ScrollView style={{ maxHeight: ROSTER_MAX_HEIGHT }}>
            <DayRoster
              rows={ready.rows}
              myProfileId={ready.myProfileId}
              myBadge={ready.myBadge}
            />
          </ScrollView>

          {ready.showActions ? (
            <View className="flex-row gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={!ready.actionsEnabled}
                onPress={ready.cancelShift}
              >
                {DAY_SHEET_COPY.cancelShift}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!ready.actionsEnabled}
                onPress={ready.requestSwap}
              >
                {DAY_SHEET_COPY.requestSwap}
              </Button>
            </View>
          ) : null}
        </View>
      )}
    </FragmentView>
  );
}
