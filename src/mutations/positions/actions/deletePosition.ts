"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePositionRecord } from "#/entities/positions/repositories/writePositionRepository";
import {
  parseDeletePositionInput,
  type DeletePositionInput,
} from "#/mutations/positions/schemas/deletePosition";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type DeletePositionDependencies = {
  client?: SupabaseClient;
  deleteRecord?: typeof deletePositionRecord;
};

export async function deletePositionAction(
  input: DeletePositionInput,
  dependencies: DeletePositionDependencies = {}
) {
  const values = parseDeletePositionInput(input);
  const client = dependencies.client ?? createSupabaseAdminClient();
  const deleteRecord = dependencies.deleteRecord ?? deletePositionRecord;

  return deleteRecord(values.id, { client });
}
