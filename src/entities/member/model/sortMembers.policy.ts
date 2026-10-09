import type {
  Member,
  MemberSummary,
} from "@/entities/member/model/member.type";

type NamedRow = Pick<MemberSummary, "displayName">;

type LeftRow = Pick<Member, "leftAt">;

const KOREAN = "ko";

function instantOf(timestamp: string | null): number {
  return timestamp === null ? 0 : Date.parse(timestamp);
}

export function sortActiveMembers<Row extends NamedRow>(
  rows: readonly Row[],
): Row[] {
  return [...rows].sort((left, right) =>
    (left.displayName ?? "").localeCompare(right.displayName ?? "", KOREAN),
  );
}

export function sortLeftMembers<Row extends LeftRow>(
  rows: readonly Row[],
): Row[] {
  return [...rows].sort(
    (left, right) => instantOf(right.leftAt) - instantOf(left.leftAt),
  );
}

export function isLeftOverAYear(leftAt: string, today: string): boolean {
  const anniversary = new Date(Date.parse(leftAt));
  anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);

  return Date.parse(today) >= anniversary.getTime();
}
