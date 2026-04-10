"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createPositionRecord } from "#/entities/positions/repositories/writePositionRepository";
import type { Position } from "#/entities/positions/models/schemas/position";
import {
  parseCreatePositionInput,
  type CreatePositionInput,
} from "#/mutations/positions/schemas/createPosition";
import { requireAdminActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type CreatePositionDependencies = {
  client?: SupabaseClient;
  createRecord?: typeof createPositionRecord;
  requireActor?: typeof requireAdminActor;
};

export async function createPositionAction(
  input: CreatePositionInput,
  dependencies: CreatePositionDependencies = {}
): Promise<Position> {
  const values = parseCreatePositionInput(input);
  const requireActor = dependencies.requireActor ?? requireAdminActor;
  await requireActor();
  const client = dependencies.client ?? createSupabaseAdminClient();
  const createRecord = dependencies.createRecord ?? createPositionRecord;

  return createRecord(
    {
      allowedGender: values.allowedGender,
      defaultRequiredCount: values.defaultRequiredCount,
      name: values.name,
    },
    { client }
  );
}
