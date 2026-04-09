"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPositionRow } from "#/entities/positions/models/mappers/mapPositionRow";
import type { Position } from "#/entities/positions/models/schemas/position";
import {
  parseCreatePositionInput,
  type CreatePositionInput,
} from "#/mutations/positions/models/schemas/createPosition";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type CreatePositionDependencies = {
  client?: SupabaseClient;
};

export async function createPositionAction(
  input: CreatePositionInput,
  dependencies: CreatePositionDependencies = {}
): Promise<Position> {
  const values = parseCreatePositionInput(input);
  const client = dependencies.client ?? createSupabaseAdminClient();
  const { data, error } = await client
    .from("positions")
    .insert({
      allowed_gender: values.allowedGender,
      name: values.name,
    })
    .select("id, name, allowed_gender")
    .single();

  if (error) {
    if ("code" in error && error.code === "23505") {
      throw new Error("같은 이름의 포지션이 이미 있습니다.");
    }

    throw new Error("포지션을 저장하지 못했습니다.");
  }

  if (!data) {
    throw new Error("생성된 포지션을 확인하지 못했습니다.");
  }

  return mapPositionRow(data);
}
