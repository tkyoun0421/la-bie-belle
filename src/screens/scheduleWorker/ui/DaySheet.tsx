import { ScrollView, View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { ROSTER_MAX_HEIGHT } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import type { RosterRow as RosterRowValue } from "@/screens/scheduleWorker/model/daySheet.policy";
import { DayRoster } from "@/screens/scheduleWorker/ui/DayRoster";

/**
 * 날 하나의 명단 시트다. 닫고 다른 날을 바로 눌러 훑는 흐름이 가벼우라고 별도 화면 대신
 * 바텀시트다(`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「날 시트 짜임」).
 *
 * **버튼 둘은 내 근무 날에만, 근무 전날까지만 선다.** 교대 요청은 아직 누를 곳이 없어 자리와
 * 모양만 둔다 — 숨기면 어느 task가 그 자리를 채우는지가 화면에서 사라진다
 * (`docs/3-build/plans/schedule-worker.md`의 「리스크·전환·되돌리기」).
 *
 * **요청을 걸어둔 근무는 버튼이 사라지지 않고 잠긴다.** 같은 근무에 취소와 교대를 겹쳐
 * 거는 길을 안 두면서도, 버튼이 통째로 없어지면 왜 없어졌는지가 화면에 안 남는다 —
 * 옆의 「취소 요청 중」 배지가 그 이유다(schedule-worker.md의 「보낸 뒤」).
 */

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
