import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { ListRow } from "@/shared/ui/ListRow";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { QuoteBlock } from "@/shared/ui/QuoteBlock";
import { Text } from "@/shared/ui/Text";
import {
  APPROVALS_COPY,
  CANCEL_REJECT_REASONS,
  CUSTOM_REJECT_MAX_LENGTH,
  CUSTOM_REJECT_REASON,
} from "@/screens/approvals/consts/approvals.const";
import type { ApprovalSheetFace } from "@/screens/approvals/model/approvals.type";
import type { CancelApprovalDetail } from "@/screens/approvals/utils/approvalDetail.utils";

/**
 * 판정을 기다리는 한 건을 여는 시트다. 정본은
 * `docs/2-design/system/screens/approvals.md`의 「상세 시트 짜임」과 「거절 짜임」이다.
 *
 * **얼굴이 둘인데 시트는 하나다.** 「거절」을 눌러도 새 시트를 안 쌓고 이 시트 안쪽이 이유
 * 고르기로 바뀐다 — 방금 읽은 글에서 이어지는 한 동작이다.
 *
 * **보내는 동안 버튼 둘이 다 잠긴다.** 「뒤로」까지 막는 것은 요청이 떠난 뒤에 시트를 닫으면
 * 결과를 어디서도 못 보기 때문이다.
 *
 * **실패해도 안 닫힌다.** 쓴 글이 그대로 남고 오른쪽 버튼만 「다시 보내기」가 된다.
 *
 * **고른 이유를 이 조각이 안 든다.** 고른 문장이 그대로 근무자에게 가고 실패하면 남아야
 * 하는 값이라 controller가 들고 내려준다
 * ([`useApprovalsScreen`](../hooks/useApprovalsScreen.ts)).
 *
 * 승인은 여기서 안 보낸다. 근무 취소의 승인은 확인 Dialog가 한 번 더 묻고 그 안에서 보낸다.
 */

export type ApprovalDetailSheetProps = {
  detail: CancelApprovalDetail;
  face: ApprovalSheetFace;
  sending: boolean;
  failed: boolean;
  chosen: string | null;
  written: string;
  canSend: boolean;
  sendLabel: string;
  onFace: (face: ApprovalSheetFace) => void;
  onApprove: () => void;
  onChoose: (value: string) => void;
  onWrite: (text: string) => void;
  onReject: () => void;
};

export function ApprovalDetailSheet({
  detail,
  face,
  sending,
  failed,
  chosen,
  written,
  canSend,
  sendLabel,
  onFace,
  onApprove,
  onChoose,
  onWrite,
  onReject,
}: ApprovalDetailSheetProps) {
  if (face === "detail") {
    return (
      <>
        <Text size="lg" weight="semibold">
          {detail.title}
        </Text>
        <Text size="sm" tone="muted" numeric className="mt-1">
          {detail.subtitle}
        </Text>
        <Text size="xs" tone="subtle" numeric className="mt-1">
          {detail.sentAtLine}
        </Text>

        <QuoteBlock className="mt-5">
          <Text size="base">{detail.reason}</Text>
        </QuoteBlock>

        <View className="mt-6 flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => onFace("reject")}
          >
            {APPROVALS_COPY.reject}
          </Button>
          <Button variant="primary" className="flex-1" onPress={onApprove}>
            {APPROVALS_COPY.approve}
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Text size="lg" weight="semibold">
        {APPROVALS_COPY.rejectTitle}
      </Text>

      <View className="mt-4">
        {CANCEL_REJECT_REASONS.map((reason, at) => (
          <ListRow
            key={reason.value}
            title={reason.label}
            selected={chosen === reason.value}
            divider={at > 0}
            className="py-3"
            onPress={() => onChoose(reason.value)}
          />
        ))}
      </View>

      {chosen === CUSTOM_REJECT_REASON ? (
        <Input
          label={APPROVALS_COPY.reasonLabel}
          placeholder={APPROVALS_COPY.reasonPlaceholder}
          value={written}
          maxLength={CUSTOM_REJECT_MAX_LENGTH}
          multiline
          className="mt-3"
          onChangeText={onWrite}
        />
      ) : null}

      <Text size="xs" tone="subtle" className="mt-3">
        {APPROVALS_COPY.reasonHint}
      </Text>

      {failed ? (
        <NoticeBlock kind="error" className="mt-4 p-4">
          {APPROVALS_COPY.sendFailed}
        </NoticeBlock>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={sending}
          onPress={() => onFace("detail")}
        >
          {APPROVALS_COPY.back}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={!canSend || sending}
          onPress={onReject}
        >
          {sendLabel}
        </Button>
      </View>
    </>
  );
}
