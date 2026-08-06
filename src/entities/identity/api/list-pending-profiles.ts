import "server-only";

import { GenderValueSchema } from "@/entities/identity/model/signup";
import type { PendingProfile } from "@/entities/identity/types/pending-profile";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ListPendingProfilesResult =
  { ok: true; data: PendingProfile[] } | { ok: false; code: ErrorCode };

type PendingProfileRow = {
  id: string;
  name: string;
  gender: string;
  birth_date: string;
  phone: string;
  created_at: string;
};

export async function listPendingProfiles(): Promise<ListPendingProfilesResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, gender, birth_date, phone, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_list_pending_profiles_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  const profiles = ((data ?? []) as PendingProfileRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    gender: GenderValueSchema.parse(row.gender),
    birthDate: row.birth_date,
    phone: row.phone,
    createdAt: row.created_at,
  }));

  return { ok: true, data: profiles };
}
