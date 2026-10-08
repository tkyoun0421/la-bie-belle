import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { CANCEL_REASON_MAX_LENGTH } from "@/screens/scheduleWorker/consts/scheduleWorker.const";

export type CancelShiftSheetProps = {
  title: string;
  reason: string;
  canSend: boolean;
  sending: boolean;
  failed: boolean;
  onChangeReason: (typed: string) => void;
  onSend: () => void;
};

export function CancelShiftSheet({
  title,
  reason,
  canSend,
  sending,
  failed,
  onChangeReason,
  onSend,
}: CancelShiftSheetProps) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text size="base" weight="semibold">
          {title}
        </Text>
        <Text size="xs" tone="subtle">
          관리자가 승인해야 취소돼요. 승인 전까지는 예정대로 근무예요
        </Text>
      </View>

      <Input
        testID="schedule-cancel-reason-input"
        value={reason}
        maxLength={CANCEL_REASON_MAX_LENGTH}
        multiline
        onChangeText={onChangeReason}
      />

      {failed ? (
        <NoticeBlock kind="error" className="p-4">
          보내지 못했어요. 다시 시도해주세요
        </NoticeBlock>
      ) : null}

      <Button
        variant="primary"
        loading={sending}
        disabled={!canSend}
        onPress={onSend}
      >
        취소 요청 보내기
      </Button>
    </View>
  );
}
