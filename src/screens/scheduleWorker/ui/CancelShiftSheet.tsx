import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { CANCEL_REASON_MAX_LENGTH } from "@/screens/scheduleWorker/consts/scheduleWorker.const";

/**
 * 내 근무를 못 나가게 됐다고 관리자에게 알리는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-worker.md`의 「근무 취소 시트 짜임」이다.
 *
 * **보내는 것은 취소가 아니라 취소 요청이다.** 관리자가 승인해야 자리가 비고 그때까지는
 * 예정대로 근무라, 부제와 버튼 둘이 그 사실을 말한다(SCH-018).
 *
 * **사유를 여기가 안 든다.** 적은 글이 그대로 관리자에게 가고 보내는 동안 잠기고 실패하면
 * 남아야 해서 통신에 매여 있다 — 조각은 제 controller를 못 가지니 화면의 controller가
 * 들고 내려보낸다([`useScheduleWorkerScreen`](../hooks/useScheduleWorkerScreen.ts)).
 * 보낼 수 있는지도 그쪽 판정이고 여기는 그 답을 버튼에 걸기만 한다.
 */

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
