export type AdminStanding = { role: string } | null;

export type AdminGuardMove = "/" | null;

const ADMIN_ROLE = "admin";

export function resolveAdminGuard(profile: AdminStanding): AdminGuardMove {
  return profile?.role === ADMIN_ROLE ? null : "/";
}
