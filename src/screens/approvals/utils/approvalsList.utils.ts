import type { ApprovalListRow } from "@/screens/approvals/model/approvals.type";

export function sortApprovals<Row extends ApprovalListRow>(
  rows: readonly Row[],
): Row[] {
  return [...rows].sort((left, right) =>
    left.workDate.localeCompare(right.workDate),
  );
}

export function removeApproval<Row extends ApprovalListRow>(
  rows: readonly Row[],
  id: string,
): Row[] {
  return rows.filter((row) => row.id !== id);
}
