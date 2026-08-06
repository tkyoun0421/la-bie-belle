import "server-only";

import { findOwnRoles } from "@/entities/identity/api/find-own-roles";
import { hasRole, type RoleValue } from "@/entities/identity/model/role";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export type RequireAdminResult = { ok: true; roles: RoleValue[] } | { ok: false; code: ErrorCode };

export async function requireAdmin(): Promise<RequireAdminResult> {
  const rolesResult = await findOwnRoles();

  if (!rolesResult.ok) {
    return { ok: false, code: rolesResult.code };
  }

  if (!hasRole(rolesResult.data, "admin")) {
    return { ok: false, code: ERROR_CODE.COMMON_FORBIDDEN };
  }

  return { ok: true, roles: rolesResult.data };
}
