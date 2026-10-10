import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { PushReachableRow } from "@/entities/notification/api/notification.dto";
import type { PushReachable } from "@/entities/notification/model/notification.type";
import { toPushReachable } from "@/entities/notification/utils/notification.mapper";

const PAGE_SIZE = 500;

export async function getPushReachable(client: DB): Promise<PushReachable[]> {
  const rows: PushReachable[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("push_reachable")
      .select("profile_id, has_device")
      .order("profile_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<PushReachableRow[]>();

    if (error) {
      throw toApiError(error);
    }

    const page = data ?? [];

    rows.push(...page.map(toPushReachable));

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}
