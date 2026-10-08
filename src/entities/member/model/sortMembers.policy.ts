type NamedRow = { display_name: string | null };

type LeftRow = { left_at: string | null };

const KOREAN = "ko";

function instantOf(timestamp: string | null): number {
  return timestamp === null ? 0 : Date.parse(timestamp);
}

export function sortActiveMembers<Row extends NamedRow>(
  rows: readonly Row[],
): Row[] {
  return [...rows].sort((left, right) =>
    (left.display_name ?? "").localeCompare(right.display_name ?? "", KOREAN),
  );
}

export function sortLeftMembers<Row extends LeftRow>(
  rows: readonly Row[],
): Row[] {
  return [...rows].sort(
    (left, right) => instantOf(right.left_at) - instantOf(left.left_at),
  );
}

export function isLeftOverAYear(leftAt: string, today: string): boolean {
  const anniversary = new Date(Date.parse(leftAt));
  anniversary.setUTCFullYear(anniversary.getUTCFullYear() + 1);

  return Date.parse(today) >= anniversary.getTime();
}
