import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPositionRow } from "#/entities/positions/models/mappers/mapPositionRow";
import {
  positionsResponseSchema,
  type Position,
} from "#/entities/positions/models/schemas/position";

type PositionRepositoryOptions = {
  client: SupabaseClient;
};

export async function readPositions(
  options: PositionRepositoryOptions
): Promise<Position[]> {
  const { client } = options;
  const { data, error } = await client
    .from("positions")
    .select("id, name, allowed_gender, default_required_count, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("포지션 목록을 불러오지 못했습니다.");
  }

  const positions = (data ?? []).map(mapPositionRow);

  return positionsResponseSchema.parse({ positions }).positions;
}
