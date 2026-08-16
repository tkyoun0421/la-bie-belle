"use server";

import "server-only";

import { requireActiveProfile } from "@/entities/identity/api/require-active-profile";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type RemovePushSubscriptionInput = { endpoint: string };

export type RemovePushSubscriptionResult = { ok: true } | { ok: false; code: ErrorCode };

export async function removePushSubscription(
  input: RemovePushSubscriptionInput,
): Promise<RemovePushSubscriptionResult> {
  const requireResult = await requireActiveProfile();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_push_subscription", {
    target_endpoint: input.endpoint,
  });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "push_remove_subscription_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return { ok: true };
}
