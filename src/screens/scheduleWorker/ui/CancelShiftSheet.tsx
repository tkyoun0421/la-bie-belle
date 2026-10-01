import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { isValidCancelReason } from "@/screens/scheduleWorker/model/cancelRequestSheet";

/**
 * 내 근무를 못 나가게 됐다고 관리자에게 알리는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「근무 취소 시트 짜임」이다.
 *
 * **보내는 것은 취소가 아니라 취소 요청이다.** 관리자가 승인해야 자리가 비고 그때까지는
 * 예정대로 근무라, 부제와 버튼 둘이 그 사실을 말한다(SCH-018).
 *
 * **사유가 필수다.** 관리자가 판정하는 근거가 그 글 하나고, 그 글이 승인할 일 화면에 그대로
 * 선다. 상한 100자는 `create_cancel_request`와 같은 수다.
 *
 * **실패해도 쓴 글이 남는다.** 시트가 열린 채 오류 블록이 버튼 위에 선다.
 */

const REASON_MAX_LENGTH = 100;

export type CancelShiftSheetProps = {
  title: string;
  sending: boolean;
  failed: boolean;
  onSend: (reason: string) => void;
};

export function CancelShiftSheet({
  title,
  sending,
  failed,
  onSend,
}: CancelShiftSheetProps) {
  const [reason, setReason] = useState("");

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
        maxLength={REASON_MAX_LENGTH}
        multiline
        onChangeText={setReason}
      />

      {failed ? (
        <NoticeBlock kind="error" className="p-4">
          보내지 못했어요. 다시 시도해주세요
        </NoticeBlock>
      ) : null}

      <Button
        variant="primary"
        loading={sending}
        disabled={!isValidCancelReason(reason)}
        onPress={() => onSend(reason.trim())}
      >
        취소 요청 보내기
      </Button>
    </View>
  );
}
