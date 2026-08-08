import "server-only";

import {
  mapPositionRow,
  type Position,
  type PositionRow,
} from "@/entities/position/model/position";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type ListPositionsResult = { ok: true; data: Position[] } | { ok: false; code: ErrorCode };

const LIST_POSITIONS_LIMIT = 1000;
const FORBIDDEN_PG_CODE = "42501";

export async function listPositions(): Promise<ListPositionsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("positions")
    .select("id, name, code, default_required_count, gender_requirement, is_default, is_active")
    .order("name", { ascending: true })
    .limit(LIST_POSITIONS_LIMIT);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "position_list_positions_failed", code: error.code })}\n`,
    );
    if (error.code === FORBIDDEN_PG_CODE) {
      return { ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE };
    }
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  return { ok: true, data: ((data ?? []) as PositionRow[]).map(mapPositionRow) };
}
