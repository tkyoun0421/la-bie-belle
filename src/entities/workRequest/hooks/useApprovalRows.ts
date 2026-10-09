import { supabase } from "@/shared/api/supabase";
import type { ApprovalListRow } from "@/entities/workRequest/model/approvalList.type";
import type { PendingApproval } from "@/entities/workRequest/model/workRequest.type";
import { usePendingApprovalsQuery } from "@/entities/workRequest/services/usePendingApprovalsQuery";
import { cancelApprovalRowTitle } from "@/entities/workRequest/utils/approvalDetail.utils";
import {
  removeApproval,
  sortApprovals,
} from "@/entities/workRequest/utils/approvalsList.utils";

export type ApprovalRowsState = "pending" | "failed" | "empty" | "rows";

export type ApprovalRow = {
  id: string;
  title: string;
  detail: string;
  press: () => void;
};

export type ApprovalRowsInput = {
  answered: string | null;
  onPress: (approval: PendingApproval) => void;
};

export type ApprovalRowsController = {
  state: ApprovalRowsState;
  rows: ApprovalRow[];
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

export function useApprovalRows({
  answered,
  onPress,
}: ApprovalRowsInput): ApprovalRowsController {
  const { data, error } = usePendingApprovalsQuery(supabase);

  const all = cancelRowsOf(data ?? []);
  const visible = answered === null ? all : removeApproval(all, answered);

  const rows: ApprovalRow[] = visible.map((row) => ({
    id: row.id,
    title: cancelApprovalRowTitle({
      displayName: row.source.name ?? "",
      workDate: row.workDate,
      position: row.source.position,
    }),
    detail: row.source.reason,
    press: () => onPress(row.source),
  }));

  function stateOf(): ApprovalRowsState {
    if (error !== null) {
      return "failed";
    }

    if (data === undefined) {
      return "pending";
    }

    return rows.length === 0 ? "empty" : "rows";
  }

  return { state: stateOf(), rows };
}
