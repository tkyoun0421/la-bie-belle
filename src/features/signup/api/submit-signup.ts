"use server";

import "server-only";

import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import {
  createSignupSchema,
  normalizePhone,
  toSignupFieldErrors,
  type SignupFieldName,
} from "@/entities/identity/model/signup";
import { PENDING_PATH } from "@/shared/config/auth-routes.config";
import { ERROR_CODE, ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type SubmitSignupInput = {
  name: string;
  phone: string;
  gender: string;
  birthDate: string;
};

export type SubmitSignupResult = {
  ok: false;
  code: ErrorCode;
  fieldErrors?: Partial<Record<SignupFieldName, string>>;
};

const PHONE_UNIQUE_CONSTRAINT = "profiles_phone_key";

export async function submitSignup(input: SubmitSignupInput): Promise<SubmitSignupResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
  }

  const profileResult = await findOwnProfile(user.id);
  if (!profileResult.ok) {
    return { ok: false, code: profileResult.code };
  }
  if (profileResult.data !== null) {
    return { ok: false, code: ERROR_CODE.IDENTITY_PROFILE_EXISTS };
  }

  const normalizedInput = { ...input, phone: normalizePhone(input.phone) };
  const parsed = createSignupSchema().safeParse(normalizedInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: ERROR_CODE.IDENTITY_VALIDATION,
      fieldErrors: toSignupFieldErrors(parsed.error),
    };
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    name: parsed.data.name,
    phone: parsed.data.phone,
    gender: parsed.data.gender,
    birth_date: parsed.data.birthDate,
  });

  if (error) {
    if (error.code === "23505" && error.message.includes(PHONE_UNIQUE_CONSTRAINT)) {
      return {
        ok: false,
        code: ERROR_CODE.IDENTITY_PHONE_TAKEN,
        fieldErrors: { phone: ERROR_CODES.IDENTITY_PHONE_TAKEN.message },
      };
    }
    process.stderr.write(
      `${JSON.stringify({ event: "identity_signup_insert_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  redirect(PENDING_PATH);
}
