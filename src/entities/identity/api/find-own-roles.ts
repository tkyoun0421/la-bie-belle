import "server-only";

import { RoleValueSchema, type RoleValue } from "@/entities/identity/model/role";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export type FindOwnRolesResult = { ok: true; data: RoleValue[] } | { ok: false; code: ErrorCode };

export async function findOwnRoles(): Promise<FindOwnRolesResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
  }

  const { data, error } = (await supabase.rpc("own_effective_roles")) as {
    data: unknown;
    error: { code: string; message: string } | null;
  };

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_find_own_roles_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  const roles = ((data ?? []) as unknown[])
    .map((value) => RoleValueSchema.safeParse(value))
    .filter((result): result is { success: true; data: RoleValue } => result.success)
    .map((result) => result.data);

  return { ok: true, data: roles };
}
