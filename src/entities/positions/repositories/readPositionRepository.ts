import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPositionRow } from "#/entities/positions/models/mappers/mapPositionRow";
import {
  positionErrors,
  positionErrorCodes,
} from "#/entities/positions/models/errors/positionError";
import {
  positionsResponseSchema,
  type Position,
} from "#/entities/positions/models/schemas/position";
import type { Database } from "#/shared/types/database";

type PositionRepositoryOptions = {
  client: SupabaseClient<Database>;
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
    throw positionErrors.create(positionErrorCodes.listFailed, {
      cause: error,
    });
  }

  const positions = (data ?? []).map(mapPositionRow);

  return positionsResponseSchema.parse({ positions }).positions;
}
