"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { GENDER_REQUIREMENT_VALUES } from "@/entities/position/model/position";
import { ADMIN_POSITIONS_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const NAME_MESSAGE = "이름을 입력해 주세요";
const PositionNameSchema = z.string().trim().min(1, NAME_MESSAGE);
const RequiredCountSchema = z.number().int().min(0);
const GenderRequirementFieldSchema = z.enum(GENDER_REQUIREMENT_VALUES);

const CreatePositionInputSchema = z.object({
  name: PositionNameSchema,
  defaultRequiredCount: RequiredCountSchema,
  genderRequirement: GenderRequirementFieldSchema,
  isDefault: z.boolean(),
});

export type CreatePositionInput = z.infer<typeof CreatePositionInputSchema>;

const UpdatePositionInputSchema = z.object({
  id: z.string().uuid(),
  name: PositionNameSchema,
  defaultRequiredCount: RequiredCountSchema,
  genderRequirement: GenderRequirementFieldSchema,
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export type UpdatePositionInput = z.infer<typeof UpdatePositionInputSchema>;

const DeletePositionInputSchema = z.object({ id: z.string().uuid() });

export type DeletePositionInput = z.infer<typeof DeletePositionInputSchema>;

export type PositionMutationResult = { ok: true } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";
const UNIQUE_VIOLATION_PG_CODE = "23505";
const FOREIGN_KEY_VIOLATION_PG_CODE = "23503";

function mapPositionMutationErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  if (pgCode === UNIQUE_VIOLATION_PG_CODE) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  if (pgCode === FOREIGN_KEY_VIOLATION_PG_CODE) {
    return ERROR_CODE.SCHEDULING_POSITION_IN_USE;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}

function revalidatePositionsPage() {
  revalidatePath(ADMIN_POSITIONS_PATH);
}

export async function createPosition(input: CreatePositionInput): Promise<PositionMutationResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = CreatePositionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("positions").insert({
    name: parsed.data.name,
    default_required_count: parsed.data.defaultRequiredCount,
    gender_requirement: parsed.data.genderRequirement,
    is_default: parsed.data.isDefault,
  });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "position_create_position_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapPositionMutationErrorCode(error.code) };
  }

  revalidatePositionsPage();
  return { ok: true };
}

export async function updatePosition(input: UpdatePositionInput): Promise<PositionMutationResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = UpdatePositionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("positions")
    .update({
      name: parsed.data.name,
      default_required_count: parsed.data.defaultRequiredCount,
      gender_requirement: parsed.data.genderRequirement,
      is_default: parsed.data.isDefault,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "position_update_position_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapPositionMutationErrorCode(error.code) };
  }

  revalidatePositionsPage();
  return { ok: true };
}

export async function deletePosition(input: DeletePositionInput): Promise<PositionMutationResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = DeletePositionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("positions").delete().eq("id", parsed.data.id);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "position_delete_position_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapPositionMutationErrorCode(error.code) };
  }

  revalidatePositionsPage();
  return { ok: true };
}
