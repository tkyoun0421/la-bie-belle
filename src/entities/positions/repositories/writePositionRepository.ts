import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPositionRow } from "#/entities/positions/models/mappers/mapPositionRow";
import {
  positionErrors,
  positionErrorCodes,
} from "#/entities/positions/models/errors/positionError";
import type {
  Position,
  PositionAllowedGender,
} from "#/entities/positions/models/schemas/position";

type PositionRepositoryOptions = {
  client: SupabaseClient;
};

export type CreatePositionRecordInput = {
  allowedGender: PositionAllowedGender;
  defaultRequiredCount: number;
  name: string;
};

export type UpdatePositionRecordInput = CreatePositionRecordInput & {
  id: string;
};

export async function createPositionRecord(
  input: CreatePositionRecordInput,
  options: PositionRepositoryOptions
): Promise<Position> {
  const { client } = options;
  const { data, error } = await client
    .from("positions")
    .insert({
      allowed_gender: input.allowedGender,
      default_required_count: input.defaultRequiredCount,
      name: input.name,
    })
    .select("id, name, allowed_gender, default_required_count, sort_order")
    .single();

  if (error) {
    if ("code" in error && error.code === "23505") {
      throw positionErrors.create(positionErrorCodes.duplicateName, {
        cause: error,
      });
    }

    throw positionErrors.create(positionErrorCodes.createFailed, {
      cause: error,
    });
  }

  if (!data) {
    throw positionErrors.create(positionErrorCodes.createResultMissing);
  }

  return mapPositionRow(data);
}

export async function updatePositionRecord(
  input: UpdatePositionRecordInput,
  options: PositionRepositoryOptions
): Promise<Position> {
  const { client } = options;
  const { data, error } = await client
    .from("positions")
    .update({
      allowed_gender: input.allowedGender,
      default_required_count: input.defaultRequiredCount,
      name: input.name,
    })
    .eq("id", input.id)
    .select("id, name, allowed_gender, default_required_count, sort_order")
    .single();

  if (error) {
    if ("code" in error && error.code === "23505") {
      throw positionErrors.create(positionErrorCodes.duplicateName, {
        cause: error,
      });
    }

    throw positionErrors.create(positionErrorCodes.updateFailed, {
      cause: error,
    });
  }

  if (!data) {
    throw positionErrors.create(positionErrorCodes.updateResultMissing);
  }

  return mapPositionRow(data);
}

export async function deletePositionRecord(
  positionId: string,
  options: PositionRepositoryOptions
) {
  const { client } = options;
  const { data, error } = await client
    .from("positions")
    .delete()
    .eq("id", positionId)
    .select("id")
    .maybeSingle();

  if (error) {
    if ("code" in error && error.code === "23503") {
      throw positionErrors.create(positionErrorCodes.deleteInUse, {
        cause: error,
      });
    }

    throw positionErrors.create(positionErrorCodes.deleteFailed, {
      cause: error,
    });
  }

  if (!data?.id) {
    throw positionErrors.create(positionErrorCodes.deleteTargetNotFound);
  }

  return data.id;
}

export async function reorderPositionRecords(
  positionIds: string[],
  options: PositionRepositoryOptions
) {
  const { client } = options;
  const { error } = await client.rpc("reorder_positions", {
    p_position_ids: positionIds,
  });

  if (error) {
    throw positionErrors.create(positionErrorCodes.reorderFailed, {
      cause: error,
    });
  }

  return positionIds;
}
