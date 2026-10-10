import { CircleX } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import {
  CONFIRM_RESULT_ICON_SIZE,
  CONFIRM_SHEET_BUTTON_TEST_ID,
} from "@/features/scheduleConfirm/consts/scheduleConfirm.const";

export type ConfirmSheetFailedProps = {
  sending: boolean;
  onConfirm: () => void;
};

export function ConfirmSheetFailed({
  sending,
  onConfirm,
}: ConfirmSheetFailedProps) {
  return (
    <>
      <View className="items-center gap-3 py-4">
        <Icon icon={CircleX} size={CONFIRM_RESULT_ICON_SIZE} />
        <Text size="lg" weight="bold">
          확정하지 못했어요
        </Text>
        <Text size="sm" tone="muted">
          근무표는 그대로 있어요 · 다시 해볼게요
        </Text>
      </View>

      <Button
        variant="primary"
        testID={CONFIRM_SHEET_BUTTON_TEST_ID}
        loading={sending}
        onPress={onConfirm}
      >
        다시 확정하기
      </Button>
    </>
  );
}
