"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseDeletePositionInput,
  type DeletePositionInput,
} from "#/mutations/positions/models/schemas/deletePosition";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type DeletePositionDependencies = {
  client?: SupabaseClient;
};

export async function deletePositionAction(
  input: DeletePositionInput,
  dependencies: DeletePositionDependencies = {}
) {
  const values = parseDeletePositionInput(input);
  const client = dependencies.client ?? createSupabaseAdminClient();
  const { data, error } = await client
    .from("positions")
    .delete()
    .eq("id", values.id)
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
