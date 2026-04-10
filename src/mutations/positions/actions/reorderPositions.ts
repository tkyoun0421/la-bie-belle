"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { reorderPositionRecords } from "#/entities/positions/repositories/writePositionRepository";
import {
  parseReorderPositionsInput,
  type ReorderPositionsInput,
} from "#/mutations/positions/schemas/reorderPositions";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type ReorderPositionsDependencies = {
  client?: SupabaseClient;
  reorderRecords?: typeof reorderPositionRecords;
};

export async function reorderPositionsAction(
  input: ReorderPositionsInput,
  dependencies: ReorderPositionsDependencies = {}
) {
  const values = parseReorderPositionsInput(input);
  const client = dependencies.client ?? createSupabaseAdminClient();
  const reorderRecords = dependencies.reorderRecords ?? reorderPositionRecords;

  return reorderRecords(values.positionIds, { client });
}
