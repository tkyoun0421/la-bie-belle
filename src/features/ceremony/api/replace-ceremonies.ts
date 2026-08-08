"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import {
  ReplaceCeremoniesInputSchema,
  mapCeremonyRpcErrorCode,
} from "@/entities/schedule/model/ceremony-manage";
import { requireAdmin } from "@/entities/identity/api/require-admin";
import { ADMIN_SCHEDULE_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ReplaceCeremoniesInput = { scheduleId: string; ceremonyTimes: string[] };

export type ReplaceCeremoniesResult =
  { ok: true; ceremonyTimes: string[]; changed: boolean } | { ok: false; code: ErrorCode };

type ReplaceCeremoniesRpcPayload = { ceremony_times: string[]; changed: boolean };

type ReplaceCeremoniesRpcResponse = {
  data: ReplaceCeremoniesRpcPayload | null;
  error: { code?: string } | null;
};

export async function replaceCeremonies(
  input: ReplaceCeremoniesInput,
): Promise<ReplaceCeremoniesResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = ReplaceCeremoniesInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = (await supabase.rpc("replace_schedule_ceremonies", {
    target_schedule_id: parsed.data.scheduleId,
    ceremony_times: parsed.data.ceremonyTimes,
  })) as ReplaceCeremoniesRpcResponse;

  revalidatePath(`${ADMIN_SCHEDULE_PATH}/${parsed.data.scheduleId}`);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_replace_ceremonies_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapCeremonyRpcErrorCode(error.code) };
  }

  const payload = data as ReplaceCeremoniesRpcPayload;
  return { ok: true, ceremonyTimes: payload.ceremony_times, changed: payload.changed };
}
