"use server";

import "server-only";

import { requireActiveProfile } from "@/entities/identity/api/require-active-profile";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type SavePushSubscriptionInput = { endpoint: string; p256dh: string; auth: string };

export type SavePushSubscriptionResult = { ok: true } | { ok: false; code: ErrorCode };

export async function savePushSubscription(
  input: SavePushSubscriptionInput,
): Promise<SavePushSubscriptionResult> {
  const requireResult = await requireActiveProfile();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_push_subscription", {
    target_endpoint: input.endpoint,
    target_p256dh: input.p256dh,
    target_auth: input.auth,
  });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "push_save_subscription_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return { ok: true };
}
