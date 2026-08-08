"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { ADMIN_SCHEDULE_DETAIL_PATTERN } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const TIME_FORMAT_MESSAGE = "시각 형식이 올바르지 않아요";
const TimeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, TIME_FORMAT_MESSAGE);

const CheckInRuleInputSchema = z.object({
  firstCeremonyAt: TimeStringSchema,
  recommendedCheckIn: TimeStringSchema,
});

export type CheckInRuleInput = z.infer<typeof CheckInRuleInputSchema>;

const DeleteCheckInRuleInputSchema = z.object({ firstCeremonyAt: TimeStringSchema });

export type DeleteCheckInRuleInput = z.infer<typeof DeleteCheckInRuleInputSchema>;

export type CheckInRuleMutationResult = { ok: true } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";
const UNIQUE_VIOLATION_PG_CODE = "23505";

function mapCheckInRuleErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  if (pgCode === UNIQUE_VIOLATION_PG_CODE) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}

function revalidateSchedulePages() {
  revalidatePath(ADMIN_SCHEDULE_DETAIL_PATTERN, "layout");
}

export async function createCheckInRule(
  input: CheckInRuleInput,
): Promise<CheckInRuleMutationResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = CheckInRuleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("check_in_rules").insert({
    first_ceremony_at: parsed.data.firstCeremonyAt,
    recommended_check_in: parsed.data.recommendedCheckIn,
  });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_create_checkin_rule_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapCheckInRuleErrorCode(error.code) };
  }

  revalidateSchedulePages();
  return { ok: true };
}

export async function updateCheckInRule(
  input: CheckInRuleInput,
): Promise<CheckInRuleMutationResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = CheckInRuleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("check_in_rules")
    .update({ recommended_check_in: parsed.data.recommendedCheckIn })
    .eq("first_ceremony_at", parsed.data.firstCeremonyAt);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_update_checkin_rule_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapCheckInRuleErrorCode(error.code) };
  }

  revalidateSchedulePages();
  return { ok: true };
}

export async function deleteCheckInRule(
  input: DeleteCheckInRuleInput,
): Promise<CheckInRuleMutationResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = DeleteCheckInRuleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("check_in_rules")
    .delete()
    .eq("first_ceremony_at", parsed.data.firstCeremonyAt);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_delete_checkin_rule_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapCheckInRuleErrorCode(error.code) };
  }

  revalidateSchedulePages();
  return { ok: true };
}
