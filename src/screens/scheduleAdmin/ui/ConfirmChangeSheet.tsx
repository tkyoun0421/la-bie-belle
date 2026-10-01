import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import {
  forceChangeCopy,
  type ForceChangeCopyInput,
} from "@/screens/schedule-admin/model/forceChangeCopy";

/**
 * 확정 뒤 모든 변경 앞에 서는 확인이다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「확정 뒤 문안」이다.
 *
 * **오른쪽이 critical이 아니다.** 자리는 남고 다시 채울 수 있다.
 *
 * **알림이 안 가도 시트를 막지 않는다.** 앱이 할 수 있는 것은 관리자가 모른 채 지나가지
 * 않게 하는 것까지다(NTF-022) — 그래서 둘째 줄이 `fg.warning`이 아니라 `fg.neutral-muted`다.
 */

export type ConfirmChangeSheetProps = {
  copy: ForceChangeCopyInput;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmChangeSheet({
  copy,
  saving,
  onClose,
  onConfirm,
}: ConfirmChangeSheetProps) {
  const { title, notice, buttons } = forceChangeCopy(copy);

  return (
    <>
      <Text size="lg" weight="bold">
        {title}
      </Text>

      <Text size="sm" tone="muted" className="mt-2">
        {notice}
      </Text>

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onClose}>
          {buttons[0]}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          loading={saving}
          onPress={onConfirm}
        >
          {buttons[1]}
        </Button>
      </View>
    </>
  );
}
