import type { MemberSummary } from "@/entities/member/model/member.type";

export type MemberFilterRow = Pick<
  MemberSummary,
  "submittedAt" | "approvedAt" | "rejectedAt" | "blockedAt"
>;

function instantOf(timestamp: string | null): number {
  return timestamp === null ? 0 : Date.parse(timestamp);
}

export function filterPendingMembers<Row extends MemberFilterRow>(
  rows: readonly Row[],
): Row[] {
  return rows
    .filter(
      (row) =>
        row.submittedAt !== null &&
        row.approvedAt === null &&
        row.rejectedAt === null &&
        row.blockedAt === null,
    )
    .sort(
      (left, right) =>
        instantOf(left.submittedAt) - instantOf(right.submittedAt),
    );
}

export function filterBlockedMembers<Row extends MemberFilterRow>(
  rows: readonly Row[],
): Row[] {
  return rows
    .filter((row) => row.blockedAt !== null)
    .sort(
      (left, right) => instantOf(right.blockedAt) - instantOf(left.blockedAt),
    );
}
