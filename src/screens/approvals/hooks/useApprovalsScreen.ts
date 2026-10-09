import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_HOME_PATH,
  ADMIN_SCHEDULE_PATH,
  ORIGIN_APPROVALS,
} from "@/shared/consts/navigation.const";
import type { PendingApproval } from "@/entities/workRequest/model/workRequest.type";
import { usePendingApprovalsQuery } from "@/entities/workRequest/services/usePendingApprovalsQuery";
import { cancelApprovalRowTitle } from "@/features/workRequest/utils/approvalDetail.utils";
import { APPROVALS_COPY } from "@/screens/approvals/consts/approvals.const";
import type { ApprovalListRow } from "@/screens/approvals/model/approvals.type";
import {
  removeApproval,
  sortApprovals,
} from "@/screens/approvals/utils/approvalsList.utils";

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
  sheet: PendingApproval | null;
  toast: string | null;
  goBack: () => void;
  closeSheet: () => void;
  finishReject: () => void;
  finishApprove: () => void;
  dismissToast: () => void;
};

type CancelRow = ApprovalListRow & { source: PendingApproval };

function cancelRowsOf(approvals: readonly PendingApproval[]): CancelRow[] {
  return sortApprovals(
    approvals.map((one) => ({
      id: one.id,
      kind: "cancel" as const,
      workDate: one.workDate,
      source: one,
    })),
  );
}

export function useApprovalsScreen(): ApprovalsScreenController {
  const router = useRouter();
  const { data: approvals } = usePendingApprovalsQuery(supabase);

  const [openId, setOpenId] = useState<string | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const all = cancelRowsOf(approvals ?? []);
  const visible = answered === null ? all : removeApproval(all, answered);
  const open = visible.find((row) => row.id === openId) ?? null;

  const closeSheet = useCallback(() => setOpenId(null), []);

  const finishReject = useCallback(() => {
    if (open === null) {
      return;
    }

    setAnswered(open.id);
    setOpenId(null);
    setToast(APPROVALS_COPY.rejected);
  }, [open]);

  const finishApprove = useCallback(() => {
    if (open === null) {
      return;
    }

    setAnswered(open.id);
    setOpenId(null);
    router.replace(
      `${ADMIN_SCHEDULE_PATH}?date=${open.workDate}&from=${ORIGIN_APPROVALS}`,
    );
  }, [open, router]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ADMIN_HOME_PATH);
  }, [router]);

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
      title: cancelApprovalRowTitle({
        displayName: row.source.name ?? "",
        workDate: row.workDate,
        position: row.source.position,
      }),
      detail: row.source.reason,
      press: () => setOpenId(row.id),
    })),
    sheet: open === null ? null : open.source,
    toast,
    goBack,
    closeSheet,
    finishReject,
    finishApprove,
    dismissToast: () => setToast(null),
  };
}
