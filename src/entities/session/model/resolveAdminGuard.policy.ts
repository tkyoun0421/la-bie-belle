import { RETRY_PATH, WORKER_HOME_PATH } from "@/shared/consts/navigation.const";

export type AdminStanding = { role: string } | null;

export type AdminGuardMove = typeof WORKER_HOME_PATH | typeof RETRY_PATH | null;

export type AdminGuardRead = { failed: boolean };

const ADMIN_ROLE = "admin";

export function resolveAdminGuard(
  profile: AdminStanding,
  { failed }: AdminGuardRead = { failed: false },
): AdminGuardMove {
  if (failed) {
    return RETRY_PATH;
  }

  return profile?.role === ADMIN_ROLE ? null : WORKER_HOME_PATH;
}
