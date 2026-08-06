import { z } from "zod";

export const ROLE_VALUES = ["worker", "admin", "super_admin"] as const;

export const RoleValueSchema = z.enum(ROLE_VALUES);
export type RoleValue = z.infer<typeof RoleValueSchema>;

export function hasRole(roles: readonly RoleValue[], role: RoleValue): boolean {
  return roles.includes(role);
}
