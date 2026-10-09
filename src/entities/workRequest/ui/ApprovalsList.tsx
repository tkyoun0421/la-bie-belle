import type { ReactNode } from "react";
import {
  useApprovalRows,
  type ApprovalRowsInput,
} from "@/entities/workRequest/hooks/useApprovalRows";
import { ApprovalRows } from "@/entities/workRequest/ui/ApprovalRows";

export type ApprovalsListProps = ApprovalRowsInput & {
  loading?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
};

export function ApprovalsList({
  loading,
  failed,
  empty,
  ...input
}: ApprovalsListProps) {
  const fragment = useApprovalRows(input);

  if (fragment.state === "pending") {
    return loading ?? null;
  }

  if (fragment.state === "failed") {
    return failed ?? null;
  }

  if (fragment.state === "empty") {
    return empty ?? null;
  }

  return <ApprovalRows rows={fragment.rows} />;
}
