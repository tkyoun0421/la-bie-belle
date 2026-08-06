import "server-only";

import { env } from "@/shared/config/env.server";
import { createSupabaseServiceClient } from "@/shared/lib/supabase-service";

export type BootstrapSuperAdminResult = { ok: true; active: boolean } | { ok: false };

export async function bootstrapSuperAdmin(
  email: string | null | undefined,
): Promise<BootstrapSuperAdminResult> {
  if (!email || email.toLowerCase() !== env.SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { ok: true, active: false };
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = (await supabase.rpc("bootstrap_super_admin", {
    bootstrap_email: email,
  })) as { data: unknown; error: { code: string; message: string } | null };

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_bootstrap_super_admin_failed", code: error.code })}\n`,
    );
    return { ok: false };
  }

  return { ok: true, active: Boolean(data) };
}
