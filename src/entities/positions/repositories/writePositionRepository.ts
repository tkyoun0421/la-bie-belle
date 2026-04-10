import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPositionRow } from "#/entities/positions/models/mappers/mapPositionRow";
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
      throw new Error("같은 이름의 포지션이 이미 있습니다.");
    }

    throw new Error("포지션을 저장하지 못했습니다.");
  }

  if (!data) {
    throw new Error("생성된 포지션을 확인하지 못했습니다.");
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
      throw new Error("같은 이름의 포지션이 이미 있습니다.");
    }

    throw new Error("포지션을 수정하지 못했습니다.");
  }

  if (!data) {
    throw new Error("수정된 포지션을 확인하지 못했습니다.");
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
      throw new Error(
        "템플릿이나 행사에서 사용 중인 포지션은 삭제할 수 없습니다."
      );
    }

    throw new Error("포지션을 삭제하지 못했습니다.");
  }

  if (!data?.id) {
    throw new Error("삭제할 포지션을 찾지 못했습니다.");
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
    throw new Error("포지션 순서를 저장하지 못했습니다.");
  }

  return positionIds;
}
