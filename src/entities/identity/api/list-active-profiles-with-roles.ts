import "server-only";

import { RoleValueSchema, type RoleValue } from "@/entities/identity/model/role";
import type { ActiveProfileWithRoles } from "@/entities/identity/types/active-profile";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export type ListActiveProfilesWithRolesResult =
  { ok: true; data: ActiveProfileWithRoles[] } | { ok: false; code: ErrorCode };

type ProfileRoleRow = { role: unknown };
type ProfileWithRolesRow = { id: string; name: string; profile_roles: ProfileRoleRow[] | null };

function toRoles(rows: ProfileRoleRow[] | null): RoleValue[] {
  const granted = (rows ?? [])
    .map((row) => RoleValueSchema.safeParse(row.role))
    .filter((result): result is { success: true; data: RoleValue } => result.success)
    .map((result) => result.data);

  return ["worker", ...granted];
}

export async function listActiveProfilesWithRoles(): Promise<ListActiveProfilesWithRolesResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, profile_roles!profile_roles_profile_id_fkey(role)")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_list_active_profiles_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  const profiles = ((data ?? []) as ProfileWithRolesRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    roles: toRoles(row.profile_roles),
  }));

  return { ok: true, data: profiles };
}
