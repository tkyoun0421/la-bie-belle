import "server-only";

import {
  mapConfirmedRoster,
  type ConfirmedRoster,
  type ConfirmedRosterApiPayload,
} from "@/entities/schedule/model/confirmed-roster";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type GetConfirmedRosterResult =
  { ok: true; data: ConfirmedRoster } | { ok: false; code: ErrorCode };

const FORBIDDEN_PG_CODE = "42501";
const NOT_CONFIRMED_PG_CODE = "LB031";
const NOT_FOUND_PG_CODE = "22023";

type GetConfirmedRosterRpcResponse = {
  data: ConfirmedRosterApiPayload | null;
  error: { code?: string; message: string } | null;
};

function mapFailureCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  if (pgCode === NOT_CONFIRMED_PG_CODE) {
    return ERROR_CODE.SCHEDULING_ROSTER_NOT_CONFIRMED;
  }
  if (pgCode === NOT_FOUND_PG_CODE) {
    return ERROR_CODE.COMMON_NOT_FOUND;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}

export async function getConfirmedRoster(scheduleId: string): Promise<GetConfirmedRosterResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = (await supabase.rpc("get_confirmed_roster", {
    target_schedule_id: scheduleId,
  })) as GetConfirmedRosterRpcResponse;

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "scheduling_get_confirmed_roster_failed", code: error.code })}\n`,
    );
    return { ok: false, code: mapFailureCode(error.code) };
  }

  return { ok: true, data: mapConfirmedRoster(data as ConfirmedRosterApiPayload) };
}
