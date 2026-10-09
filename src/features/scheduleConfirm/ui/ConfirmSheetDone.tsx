import { CircleCheck } from "lucide-react-native";
import { View } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { CONFIRM_RESULT_ICON_SIZE } from "@/features/scheduleConfirm/consts/scheduleConfirm.const";

export type ConfirmSheetDoneProps = {
  title: string;
  note: string;
};

export function ConfirmSheetDone({ title, note }: ConfirmSheetDoneProps) {
  return (
    <View className="items-center gap-3 py-4">
      <Icon icon={CircleCheck} size={CONFIRM_RESULT_ICON_SIZE} />
      <Text size="lg" weight="bold">
        {title}
      </Text>
      <Text size="sm" tone="muted">
        {note}
      </Text>
    </View>
  );
}
