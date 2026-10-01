import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { discardSlotWarningLine } from "@/screens/scheduleAdmin/model/discardSlot";

/**
 * 사람이 든 자리를 버리기 전에 서는 확인이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「날 상세 문안」 「배정 있는
 * 자리 버릴 때」 행이다.
 *
 * **빈 자리에는 이 시트가 안 선다** — 놓는 순간 사라진다. 그 갈림은 `discard-slot.ts`가 한다.
 *
 * 왼쪽이 「그만두기」인 것은 [날 닫기 경고](CloseDayWarningSheet.tsx)와 같은 이유다 — 이
 * 시트에서 「닫기」는 시트를 닫는 것과 자리를 닫는 것 둘로 읽힌다.
 */

export type DiscardSlotSheetProps = {
  name: string;
  removing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DiscardSlotSheet({
  name,
  removing,
  onCancel,
  onConfirm,
}: DiscardSlotSheetProps) {
  return (
    <>
      <Text size="lg" weight="bold">
        자리를 지울까요?
      </Text>

      <Text size="sm" tone="muted" className="mt-2">
        {discardSlotWarningLine(name)}
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onCancel}>
          그만두기
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={removing}
          onPress={onConfirm}
        >
          지우기
        </Button>
      </View>
    </>
  );
}
