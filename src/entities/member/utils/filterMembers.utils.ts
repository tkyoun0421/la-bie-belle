export type MemberFilterRow = {
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  blocked_at: string | null;
};

function instantOf(timestamp: string | null): number {
  return timestamp === null ? 0 : Date.parse(timestamp);
}

export function filterPendingMembers<Row extends MemberFilterRow>(
  rows: readonly Row[],
): Row[] {
  return rows
    .filter(
      (row) =>
        row.submitted_at !== null &&
        row.approved_at === null &&
        row.rejected_at === null &&
        row.blocked_at === null,
    )
    .sort(
      (left, right) =>
        instantOf(left.submitted_at) - instantOf(right.submitted_at),
    );
}

export function filterBlockedMembers<Row extends MemberFilterRow>(
  rows: readonly Row[],
): Row[] {
  return rows
    .filter((row) => row.blocked_at !== null)
    .sort(
      (left, right) => instantOf(right.blocked_at) - instantOf(left.blocked_at),
    );
}
