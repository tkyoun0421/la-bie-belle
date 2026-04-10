"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePositionRecord } from "#/entities/positions/repositories/writePositionRepository";
import type { Position } from "#/entities/positions/models/schemas/position";
import {
  parseUpdatePositionInput,
  type UpdatePositionInput,
} from "#/mutations/positions/schemas/updatePosition";
import { requireAdminActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type UpdatePositionDependencies = {
  client?: SupabaseClient<Database>;
  requireActor?: typeof requireAdminActor;
  updateRecord?: typeof updatePositionRecord;
};

export async function updatePositionAction(
  input: UpdatePositionInput,
  dependencies: UpdatePositionDependencies = {}
): Promise<Position> {
  const values = parseUpdatePositionInput(input);
  const requireActor = dependencies.requireActor ?? requireAdminActor;
  await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const updateRecord = dependencies.updateRecord ?? updatePositionRecord;

  return updateRecord(
    {
      allowedGender: values.allowedGender,
      defaultRequiredCount: values.defaultRequiredCount,
      id: values.id,
      name: values.name,
    },
    { client }
  );
}
