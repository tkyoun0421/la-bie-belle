"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePositionRecord } from "#/entities/positions/repositories/writePositionRepository";
import type { Position } from "#/entities/positions/models/schemas/position";
import {
  parseUpdatePositionInput,
  type UpdatePositionInput,
} from "#/mutations/positions/schemas/updatePosition";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type UpdatePositionDependencies = {
  client?: SupabaseClient;
  updateRecord?: typeof updatePositionRecord;
};

export async function updatePositionAction(
  input: UpdatePositionInput,
  dependencies: UpdatePositionDependencies = {}
): Promise<Position> {
  const values = parseUpdatePositionInput(input);
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
