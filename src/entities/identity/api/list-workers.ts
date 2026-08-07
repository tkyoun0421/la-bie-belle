import "server-only";

import { ProfileStatusSchema, type ProfileStatus } from "@/entities/identity/model/profile-gate";
import type { WorkerListItem } from "@/entities/identity/types/worker";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ListWorkersParams = {
  search?: string;
  status?: ProfileStatus;
};

export type ListWorkersResult =
  { ok: true; data: WorkerListItem[] } | { ok: false; code: ErrorCode };

type WorkerRow = { id: string; name: string; status: string };

export async function listWorkers(params: ListWorkersParams = {}): Promise<ListWorkersResult> {
  const supabase = await createSupabaseServerClient();
  const status = params.status ?? "active";
  const search = params.search?.trim();

  let query = supabase.from("profiles").select("id, name, status").eq("status", status);

  if (search !== undefined && search.length > 0) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "identity_list_workers_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  const workers = ((data ?? []) as WorkerRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    status: ProfileStatusSchema.parse(row.status),
  }));

  return { ok: true, data: workers };
}
