import { hasRole, type RoleValue } from "@/entities/identity/model/role";

export function roleLabel(roles: readonly RoleValue[]): string {
  if (hasRole(roles, "super_admin")) {
    return "슈퍼 관리자";
  }
  if (hasRole(roles, "admin")) {
    return "관리자";
  }
  return "근무자";
}
