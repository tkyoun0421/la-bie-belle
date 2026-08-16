"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireActiveProfile } from "@/entities/identity/api/require-active-profile";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const NOTIFICATIONS_PATH = "/notifications";

export type MarkNotificationReadResult = { ok: true } | { ok: false; code: ErrorCode };

export async function markNotificationRead(
  notificationId: string,
): Promise<MarkNotificationReadResult> {
  const requireResult = await requireActiveProfile();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("mark_notification_read", {
    target_notification_id: notificationId,
  });

  revalidatePath(NOTIFICATIONS_PATH);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "notification_mark_notification_read_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return { ok: true };
}
