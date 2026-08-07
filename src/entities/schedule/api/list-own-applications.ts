import "server-only";

import {
  OwnApplicationStatusSchema,
  type OwnApplicationStatus,
} from "@/entities/schedule/model/recruitment-schedule";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type OwnApplication = { scheduleId: string; status: OwnApplicationStatus };

export type ListOwnApplicationsParams = { scheduleIds: readonly string[] };

export type ListOwnApplicationsResult =
  { ok: true; data: OwnApplication[] } | { ok: false; code: ErrorCode };

type OwnApplicationRow = { schedule_id: string; status: string };

export async function listOwnApplications(
  params: ListOwnApplicationsParams,
): Promise<ListOwnApplicationsResult> {
  if (params.scheduleIds.length === 0) {
    return { ok: true, data: [] };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED };
  }

  const { data, error } = await supabase
    .from("applications")
    .select("schedule_id, status")
    .eq("profile_id", user.id)
    .in("schedule_id", params.scheduleIds);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_list_own_applications_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return {
    ok: true,
    data: ((data ?? []) as OwnApplicationRow[]).map((row) => ({
      scheduleId: row.schedule_id,
      status: OwnApplicationStatusSchema.parse(row.status),
    })),
  };
}
