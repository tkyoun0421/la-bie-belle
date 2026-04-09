"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseReorderPositionsInput,
  type ReorderPositionsInput,
} from "#/mutations/positions/schemas/reorderPositions";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type ReorderPositionsDependencies = {
  client?: SupabaseClient;
};

export async function reorderPositionsAction(
  input: ReorderPositionsInput,
  dependencies: ReorderPositionsDependencies = {}
) {
  const values = parseReorderPositionsInput(input);
  const client = dependencies.client ?? createSupabaseAdminClient();
  const { error } = await client.rpc("reorder_positions", {
    p_position_ids: values.positionIds,
  });

  if (error) {
    throw new Error("포지션 순서를 저장하지 못했습니다.");
  }

  return values.positionIds;
}
