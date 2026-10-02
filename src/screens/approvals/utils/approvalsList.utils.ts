import type { ApprovalListRow } from "@/screens/approvals/model/approvals.type";

/**
 * 「승인할 일」 목록의 순서와 처리한 줄 빼기다. 정본은
 * `docs/2-design/system/screens/approvals.md`의 「목록 짜임」이다.
 *
 * **근무 날이 가까운 것부터다.** 취소는 근무 전날이 마감이고 승인한 뒤 빈 자리를 채울
 * 시간까지 필요해서, 늦게 온 것이라도 근무가 먼저면 먼저 답해야 한다.
 *
 * **처리한 줄은 목록에서 빠진다.** 승인이든 거절이든 다시 안 보인다(「끝난 뒤」) — 둘이
 * 동시에 판정해 `already_decided`가 와도 같은 손으로 지운다.
 *
 * 지금 서는 줄은 근무 취소뿐이다. 사유 줄은 `attendance-excuse`가 같은 목록에 잇고 그때
 * 「근무 취소가 위」라는 두 번째 기준이 붙는다.
 */

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
