import { useCallback, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  cancelApprovalConfirmBody,
  cancelApprovalDetail,
} from "@/entities/workRequest/utils/approvalDetail.utils";
import { APPROVAL_SHEET_COPY } from "@/features/workRequest/consts/workRequest.const";
import type {
  ApprovalDetailSheetController,
  ApprovalDetailSheetInput,
  ApprovalSheetFace,
} from "@/features/workRequest/model/approvalDetailSheet.type";
import {
  isRejectReasonValid,
  rejectReasonText,
} from "@/features/workRequest/model/rejectReason.policy";
import { useDecideCancelRequestMutation } from "@/features/workRequest/services/useDecideCancelRequestMutation";

function sendLabelOf(sending: boolean, failed: boolean): string {
  if (sending) {
    return APPROVAL_SHEET_COPY.sending;
  }

  return failed ? APPROVAL_SHEET_COPY.resend : APPROVAL_SHEET_COPY.sendReject;
}

export function useApprovalDetailSheet({
  approval,
  onRejected,
  onApproved,
}: ApprovalDetailSheetInput): ApprovalDetailSheetController {
  const [face, setFace] = useState<ApprovalSheetFace>("detail");
  const [chosen, setChosen] = useState<string | null>(null);
  const [written, setWritten] = useState("");
  const [confirming, setConfirming] = useState(false);

  const { mutate, isPending, isError, reset } =
    useDecideCancelRequestMutation(supabase);

  const names = {
    displayName: approval.name ?? "",
    workDate: approval.workDate,
    position: approval.position,
  };

  const reject = useCallback(() => {
    if (!isRejectReasonValid(chosen, written)) {
      return;
    }

    mutate(
      {
        cancelRequestId: approval.id,
        decision: "rejected",
        reason: rejectReasonText(chosen, written),
      },
      { onSuccess: onRejected },
    );
  }, [approval.id, chosen, written, mutate, onRejected]);

  const approve = useCallback(() => {
    mutate(
      { cancelRequestId: approval.id, decision: "approved" },
      { onSuccess: onApproved },
    );
  }, [approval.id, mutate, onApproved]);

  const cancelApprove = useCallback(() => {
    setConfirming(false);
    reset();
  }, [reset]);

  return {
    detail: cancelApprovalDetail({
      ...names,
      startsAt: approval.startsAt,
      endsAt: approval.endsAt,
      sentAt: approval.createdAt,
      reason: approval.reason,
    }),
    face,
    sending: isPending,
    failedLine: isError ? APPROVAL_SHEET_COPY.sendFailed : null,
    chosen,
    written,
    canSend: isRejectReasonValid(chosen, written),
    sendLabel: sendLabelOf(isPending, isError),
    confirming,
    confirmBody: cancelApprovalConfirmBody(names),
    confirmLabel: isError
      ? APPROVAL_SHEET_COPY.confirmRetry
      : APPROVAL_SHEET_COPY.confirmApprove,
    showFace: setFace,
    choose: setChosen,
    write: setWritten,
    reject,
    askApprove: () => setConfirming(true),
    cancelApprove,
    approve,
  };
}
