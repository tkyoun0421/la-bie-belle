import type { RoleValue } from "@/entities/identity/model/role";

export type ActiveProfileWithRoles = { id: string; name: string; roles: RoleValue[] };
