import "server-only";

import { mapRequirementRpcErrorCode } from "@/entities/schedule/model/requirement-manage";
import { type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type EnsureScheduleRequirementsCopiedResult = { ok: true } | { ok: false; code: ErrorCode };

export async function ensureScheduleRequirementsCopied(
  scheduleId: string,
): Promise<EnsureScheduleRequirementsCopiedResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("copy_schedule_requirements", {
    target_schedule_id: scheduleId,
  });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({
        event: "scheduling_ensure_schedule_requirements_copied_failed",
        code: error.code,
      })}\n`,
    );
    return { ok: false, code: mapRequirementRpcErrorCode(error.code) };
  }

  return { ok: true };
}
