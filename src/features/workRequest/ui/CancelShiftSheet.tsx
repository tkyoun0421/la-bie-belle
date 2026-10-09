import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { CANCEL_REASON_MAX_LENGTH } from "@/features/workRequest/consts/workRequest.const";
import { useCancelShiftSheet } from "@/features/workRequest/hooks/useCancelShiftSheet";

export type CancelShiftSheetProps = {
  assignmentId: string;
  workDate: string;
  position: string;
  onSent: () => void;
};

export function CancelShiftSheet(props: CancelShiftSheetProps) {
  const fragment = useCancelShiftSheet(props);

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text size="base" weight="semibold">
          {fragment.title}
        </Text>
        <Text size="xs" tone="subtle">
          관리자가 승인해야 취소돼요. 승인 전까지는 예정대로 근무예요
        </Text>
      </View>

      <Input
        testID="schedule-cancel-reason-input"
        value={fragment.reason}
        maxLength={CANCEL_REASON_MAX_LENGTH}
        multiline
        onChangeText={fragment.writeReason}
      />

      {fragment.failed ? (
        <NoticeBlock kind="error" className="p-4">
          보내지 못했어요. 다시 시도해주세요
        </NoticeBlock>
      ) : null}

      <Button
        variant="primary"
        loading={fragment.sending}
        disabled={!fragment.canSend}
        onPress={fragment.send}
      >
        취소 요청 보내기
      </Button>
    </View>
  );
}
