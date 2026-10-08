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
