import { WORKER_HOME_PATH } from "@/shared/consts/navigation.const";

export type AdminStanding = { role: string } | null;

export type AdminGuardMove = typeof WORKER_HOME_PATH | null;

const ADMIN_ROLE = "admin";

export function resolveAdminGuard(profile: AdminStanding): AdminGuardMove {
  return profile?.role === ADMIN_ROLE ? null : WORKER_HOME_PATH;
}
