"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePositionRecord } from "#/entities/positions/repositories/writePositionRepository";
import {
  parseDeletePositionInput,
  type DeletePositionInput,
} from "#/mutations/positions/schemas/deletePosition";
import { requireAdminActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type DeletePositionDependencies = {
  client?: SupabaseClient;
  deleteRecord?: typeof deletePositionRecord;
  requireActor?: typeof requireAdminActor;
};

export async function deletePositionAction(
  input: DeletePositionInput,
  dependencies: DeletePositionDependencies = {}
) {
  const values = parseDeletePositionInput(input);
  const requireActor = dependencies.requireActor ?? requireAdminActor;
  await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const deleteRecord = dependencies.deleteRecord ?? deletePositionRecord;

  return deleteRecord(values.id, { client });
}
