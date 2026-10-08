import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";
import type { PushReachable } from "@/entities/notification/model/notification.type";
import { toPushReachable } from "@/entities/notification/utils/notification.mapper";

type ViewRow = {
  profile_id: string | null;
  has_device: boolean | null;
};

const PAGE_SIZE = 500;

export async function getPushReachable(client: DB): Promise<PushReachable[]> {
  const rows: PushReachable[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("push_reachable")
      .select("profile_id, has_device")
      .order("profile_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<ViewRow[]>();

    if (error) {
      throw toApiError(error);
    }

    const page = data ?? [];

    for (const row of page) {
      if (row.profile_id !== null && row.has_device !== null) {
        rows.push(
          toPushReachable({
            profile_id: row.profile_id,
            has_device: row.has_device,
          }),
        );
      }
    }

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}
