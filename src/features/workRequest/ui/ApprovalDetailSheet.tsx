import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { ListRow } from "@/shared/ui/ListRow";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { QuoteBlock } from "@/shared/ui/QuoteBlock";
import { Text } from "@/shared/ui/Text";
import type { PendingApproval } from "@/entities/workRequest/model/workRequest.type";
import {
  APPROVAL_SHEET_COPY,
  CANCEL_REJECT_REASONS,
  CUSTOM_REJECT_MAX_LENGTH,
  CUSTOM_REJECT_REASON,
} from "@/features/workRequest/consts/workRequest.const";
import { useApprovalDetailSheet } from "@/features/workRequest/hooks/useApprovalDetailSheet";

export type ApprovalDetailSheetProps = {
  approval: PendingApproval;
  onRejected: () => void;
  onApproved: () => void;
};

export function ApprovalDetailSheet({
  approval,
  onRejected,
  onApproved,
}: ApprovalDetailSheetProps) {
  const sheet = useApprovalDetailSheet({ approval, onRejected, onApproved });

  return (
    <>
      {sheet.face === "detail" ? (
        <>
          <Text size="lg" weight="semibold">
            {sheet.detail.title}
          </Text>
          <Text size="sm" tone="muted" numeric className="mt-1">
            {sheet.detail.subtitle}
          </Text>
          <Text size="xs" tone="subtle" numeric className="mt-1">
            {sheet.detail.sentAtLine}
          </Text>

          <QuoteBlock className="mt-5">
            <Text size="base">{sheet.detail.reason}</Text>
          </QuoteBlock>

          <View className="mt-6 flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => sheet.showFace("reject")}
            >
              {APPROVAL_SHEET_COPY.reject}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onPress={sheet.askApprove}
            >
              {APPROVAL_SHEET_COPY.approve}
            </Button>
          </View>
        </>
      ) : (
        <>
          <Text size="lg" weight="semibold">
            {APPROVAL_SHEET_COPY.rejectTitle}
          </Text>

          <View className="mt-4">
            {CANCEL_REJECT_REASONS.map((reason, at) => (
              <ListRow
                key={reason.value}
                title={reason.label}
                selected={sheet.chosen === reason.value}
                divider={at > 0}
                className="py-3"
                onPress={() => sheet.choose(reason.value)}
              />
            ))}
          </View>

          {sheet.chosen === CUSTOM_REJECT_REASON ? (
            <Input
              label={APPROVAL_SHEET_COPY.reasonLabel}
              placeholder={APPROVAL_SHEET_COPY.reasonPlaceholder}
              value={sheet.written}
              maxLength={CUSTOM_REJECT_MAX_LENGTH}
              multiline
              className="mt-3"
              onChangeText={sheet.write}
            />
          ) : null}

          <Text size="xs" tone="subtle" className="mt-3">
            {APPROVAL_SHEET_COPY.reasonHint}
          </Text>

          {sheet.failedLine === null ? null : (
            <NoticeBlock kind="error" className="mt-4 p-4">
              {sheet.failedLine}
            </NoticeBlock>
          )}

          <View className="mt-6 flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={sheet.sending}
              onPress={() => sheet.showFace("detail")}
            >
              {APPROVAL_SHEET_COPY.back}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={!sheet.canSend || sheet.sending}
              onPress={sheet.reject}
            >
              {sheet.sendLabel}
            </Button>
          </View>
        </>
      )}

      <Dialog
        visible={sheet.confirming}
        title={APPROVAL_SHEET_COPY.confirmTitle}
        notice={sheet.failedLine ?? undefined}
        closeLabel={APPROVAL_SHEET_COPY.confirmBack}
        confirmLabel={sheet.confirmLabel}
        destructive
        onClose={sheet.cancelApprove}
        onConfirm={sheet.approve}
      >
        {sheet.confirmBody}
      </Dialog>
    </>
  );
}
