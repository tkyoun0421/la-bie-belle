import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import {
  forceChangeCopy,
  type ForceChangeCopyInput,
} from "@/screens/scheduleAdmin/utils/forceChangeCopy.utils";

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
