type AdminRow = {
  id: string;
  role: string;
  left_at: string | null;
  blocked_at: string | null;
};

function isActiveAdmin(row: AdminRow): boolean {
  return (
    row.role === "admin" && row.left_at === null && row.blocked_at === null
  );
}

export function isLastAdmin(
  rows: readonly AdminRow[],
  profileId: string,
): boolean {
  const admins = rows.filter(isActiveAdmin);

  return admins.length === 1 && admins[0].id === profileId;
}
