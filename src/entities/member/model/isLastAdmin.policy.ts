import type { Member } from "@/entities/member/model/member.type";

type AdminRow = Pick<Member, "id" | "role" | "leftAt" | "blockedAt">;

function isActiveAdmin(row: AdminRow): boolean {
  return row.role === "admin" && row.leftAt === null && row.blockedAt === null;
}

export function isLastAdmin(
  rows: readonly AdminRow[],
  profileId: string,
): boolean {
  const admins = rows.filter(isActiveAdmin);

  return admins.length === 1 && admins[0].id === profileId;
}
