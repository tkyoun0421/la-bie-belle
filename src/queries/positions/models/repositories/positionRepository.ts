import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPositionRow } from "#/queries/positions/models/mappers/mapPositionRow";
import {
  positionsResponseSchema,
  type Position,
} from "#/queries/positions/models/schemas/position";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type PositionRepositoryOptions = {
  client?: SupabaseClient;
};

export async function readPositions(
  options: PositionRepositoryOptions = {}
): Promise<Position[]> {
  const client = options.client ?? createSupabaseAdminClient();
  const { data, error } = await client
    .from("positions")
    .select("id, name, allowed_gender")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("포지션 목록을 불러오지 못했습니다.");
  }

  const positions = (data ?? []).map(mapPositionRow);

  return positionsResponseSchema.parse({ positions }).positions;
}
