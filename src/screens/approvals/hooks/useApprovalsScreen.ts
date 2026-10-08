import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import type { PendingApproval } from "@/entities/workRequest/api/workRequest.dto";
import type { CancelDecision } from "@/entities/workRequest/model/workRequest.type";
import { usePendingApprovalsQuery } from "@/entities/workRequest/services/usePendingApprovalsQuery";
import { useDecideCancelRequestMutation } from "@/features/workRequest/services/useDecideCancelRequestMutation";
import { APPROVALS_COPY } from "@/screens/approvals/consts/approvals.const";
import type {
  ApprovalListRow,
  ApprovalSheetFace,
} from "@/screens/approvals/model/approvals.type";
import {
  isRejectReasonValid,
  rejectReasonText,
} from "@/screens/approvals/model/rejectReason.policy";
import {
  cancelApprovalConfirmBody,
  cancelApprovalDetail,
  cancelApprovalRowTitle,
  type CancelApprovalDetail,
} from "@/screens/approvals/utils/approvalDetail.utils";
import {
  removeApproval,
  sortApprovals,
} from "@/screens/approvals/utils/approvalsList.utils";

export type ApprovalsRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (destination: string) => void;
};

export type ApprovalsListState = "loading" | "empty" | "rows";

export type ApprovalsScreenRow = {
  id: string;
  title: string;
  detail: string;
  press: () => void;
};

export type ApprovalsScreenController = {
  listState: ApprovalsListState;
  rows: ApprovalsScreenRow[];
  detail: CancelApprovalDetail | null;
  face: ApprovalSheetFace;
  sending: boolean;
  failed: boolean;
  chosen: string | null;
  written: string;
  canSend: boolean;
  sendLabel: string;
  confirming: boolean;
  confirmBody: string;
  confirmLabel: string;
  confirmNotice: string | undefined;
  toast: string | null;
  goBack: () => void;
  closeSheet: () => void;
  showFace: (face: ApprovalSheetFace) => void;
  choose: (value: string) => void;
  write: (text: string) => void;
  reject: () => void;
  askApprove: () => void;
  cancelApprove: () => void;
  approve: () => void;
  dismissToast: () => void;
};

type CancelRow = ApprovalListRow & { source: PendingApproval };

type SentDecision = { row: CancelRow; decision: CancelDecision };

function cancelRowsOf(approvals: readonly PendingApproval[]): CancelRow[] {
  return sortApprovals(
    approvals.map((one) => ({
      id: one.id,
      kind: "cancel" as const,
      workDate: one.assignments.days.work_date,
      source: one,
    })),
  );
}

function namesOf(row: CancelRow) {
  return {
    displayName: row.source.profiles?.display_name ?? "",
    workDate: row.workDate,
    position: row.source.assignments.position,
  };
}

function detailOf(row: CancelRow): CancelApprovalDetail {
  return cancelApprovalDetail({
    ...namesOf(row),
    startsAt: row.source.assignments.days.starts_at,
    endsAt: row.source.assignments.days.ends_at,
    sentAt: row.source.created_at,
    reason: row.source.reason,
  });
}

function sendLabelOf(sending: boolean, failed: boolean): string {
  if (sending) {
    return APPROVALS_COPY.sending;
  }

  return failed ? APPROVALS_COPY.resend : APPROVALS_COPY.sendReject;
}

export function useApprovalsScreen(
  router: ApprovalsRouter,
): ApprovalsScreenController {
  const { data: approvals } = usePendingApprovalsQuery(supabase);
  const { mutate, isPending, isSuccess, isError, reset } =
    useDecideCancelRequestMutation(supabase);

  const [openId, setOpenId] = useState<string | null>(null);
  const [face, setFace] = useState<ApprovalSheetFace>("detail");
  const [chosen, setChosen] = useState<string | null>(null);
  const [written, setWritten] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState<SentDecision | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const closeSheet = useCallback(() => {
    setOpenId(null);
    setFace("detail");
    setChosen(null);
    setWritten("");
    setConfirming(false);
    reset();
  }, [reset]);

  useEffect(() => {
    if (!isSuccess || sent === null) {
      return;
    }

    setAnswered(sent.row.id);
    closeSheet();
    setSent(null);

    if (sent.decision === "approved") {
      router.replace(
        `/admin/schedule?date=${sent.row.workDate}&from=approvals`,
      );
      return;
    }

    setToast(APPROVALS_COPY.rejected);
  }, [isSuccess, sent, closeSheet, router]);

  const all = cancelRowsOf(approvals ?? []);
  const visible = answered === null ? all : removeApproval(all, answered);
  const open = visible.find((row) => row.id === openId) ?? null;

  const listState: ApprovalsListState =
    approvals === undefined
      ? "loading"
      : visible.length === 0
        ? "empty"
        : "rows";

  return {
    listState,
    rows: visible.map((row) => ({
      id: row.id,
      title: cancelApprovalRowTitle(namesOf(row)),
      detail: row.source.reason,
      press: () => {
        setOpenId(row.id);
        setFace("detail");
        setChosen(null);
        setWritten("");
        reset();
      },
    })),
    detail: open === null ? null : detailOf(open),
    face,
    sending: isPending,
    failed: isError,
    chosen,
    written,
    canSend: isRejectReasonValid(chosen, written),
    sendLabel: sendLabelOf(isPending, isError),
    confirming,
    confirmBody: open === null ? "" : cancelApprovalConfirmBody(namesOf(open)),
    confirmLabel: isError
      ? APPROVALS_COPY.confirmRetry
      : APPROVALS_COPY.confirmApprove,
    confirmNotice: isError ? APPROVALS_COPY.sendFailed : undefined,
    toast,
    goBack: () =>
      router.canGoBack() ? router.back() : router.replace("/admin"),
    closeSheet,
    showFace: setFace,
    choose: setChosen,
    write: setWritten,
    reject: () => {
      if (open === null || !isRejectReasonValid(chosen, written)) {
        return;
      }

      setSent({ row: open, decision: "rejected" });
      mutate({
        cancelRequestId: open.id,
        decision: "rejected",
        reason: rejectReasonText(chosen, written),
      });
    },
    askApprove: () => setConfirming(true),
    cancelApprove: () => {
      setConfirming(false);
      reset();
    },
    approve: () => {
      if (open === null) {
        return;
      }

      setSent({ row: open, decision: "approved" });
      mutate({ cancelRequestId: open.id, decision: "approved" });
    },
    dismissToast: () => setToast(null),
  };
}
