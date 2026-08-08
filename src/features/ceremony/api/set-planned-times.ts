"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import {
  SetPlannedTimesInputSchema,
  mapCeremonyRpcErrorCode,
} from "@/entities/schedule/model/ceremony-manage";
import { requireAdmin } from "@/entities/identity/api/require-admin";
import { ADMIN_SCHEDULE_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type SetPlannedTimesInput = { scheduleId: string; checkin: string; checkout: string };

export type SetPlannedTimesResult = { ok: true } | { ok: false; code: ErrorCode };

export async function setPlannedTimes(input: SetPlannedTimesInput): Promise<SetPlannedTimesResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = SetPlannedTimesInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_schedule_planned_times", {
    target_schedule_id: parsed.data.scheduleId,
    checkin: parsed.data.checkin,
    checkout: parsed.data.checkout,
  });

  revalidatePath(`${ADMIN_SCHEDULE_PATH}/${parsed.data.scheduleId}`);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_set_planned_times_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapCeremonyRpcErrorCode(error.code) };
  }

  return { ok: true };
}
