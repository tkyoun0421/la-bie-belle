import { ScrollView, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import type { RosterRow as RosterRowValue } from "@/screens/schedule-worker/model/day-sheet";
import { DayRoster } from "@/screens/schedule-worker/ui/DayRoster";

/**
 * 날 하나의 명단 시트다. 닫고 다른 날을 바로 눌러 훑는 흐름이 가벼우라고 별도 화면 대신
 * 바텀시트다(`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「날 시트 짜임」).
 *
 * **버튼 둘은 내 근무 날에만, 근무 전날까지만 선다.** 누를 곳이 아직 없는 것은 이 task 밖이라
 * 자리와 모양만 둔다 — 숨기면 어느 task가 그 자리를 채우는지가 화면에서 사라진다
 * (`docs/3-build/plans/schedule-worker.md`의 「리스크·전환·되돌리기」).
 */

const ROSTER_MAX_HEIGHT = 360;

export type DaySheetProps = {
  title: string;
  subtitle: string;
  summaryLine?: string;
  rows: RosterRowValue[];
  myProfileId: string | null;
  showActions: boolean;
  onCancelShift: () => void;
  onRequestSwap: () => void;
};

export function DaySheet({
  title,
  subtitle,
  summaryLine,
  rows,
  myProfileId,
  showActions,
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
        <DayRoster rows={rows} myProfileId={myProfileId} />
      </ScrollView>

      {showActions ? (
        <View className="flex-row gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={onCancelShift}
          >
            근무 취소
          </Button>
          <Button variant="primary" className="flex-1" onPress={onRequestSwap}>
            교대 요청
          </Button>
        </View>
      ) : null}
    </View>
  );
}
