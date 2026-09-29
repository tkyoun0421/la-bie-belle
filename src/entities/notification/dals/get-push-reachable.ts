import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 관리자가 사람마다 알림이 닿는지를 읽는 자리다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「알림을 받나」다.
 *
 * **주소는 안 온다.** `push_tokens`는 본인 행만 읽는 표라 관리자가 남의 주소를 볼 길이
 * 없고, 그래서 존재 여부만 내는 뷰가 따로 선다 — `profile_id`와 `has_device` 둘뿐이다.
 *
 * **관리자가 아니면 예외가 아니라 빈 결과다.** 뷰 자체가 `where public.is_admin()`이라
 * 읽는 손이 권한을 따로 안 묻는다(`docs/2-design/system/data-access.md`의 「읽기 RLS 기본값」).
 *
 * **한 쪽씩 끝까지 읽는다.** 이 뷰는 사람 수만큼 행을 내는데 PostgREST가 한 응답을
 * `max_rows`(`supabase/config.toml`)에서 자른다 — 조건 없이 한 번만 읽으면 그 선을 넘은
 * 사람이 조용히 「기기 없음」으로 읽힌다. 순서를 박고 짧은 쪽이 올 때까지 이어 읽는다.
 *
 * 뷰의 생성 타입은 두 열이 다 널을 허용한다 — 뷰라서 붙는 널이고 `profiles`가 기준이라
 * 실제로는 안 빈다. 널로 온 행은 갈래를 못 정하니 안 담는다.
 */

export type PushReachableRow = {
  profile_id: string;
  has_device: boolean;
};

type ViewRow = {
  profile_id: string | null;
  has_device: boolean | null;
};

const PAGE_SIZE = 500;

export async function getPushReachable(
  client: Db,
): Promise<PushReachableRow[]> {
  const rows: PushReachableRow[] = [];

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
        rows.push({
          profile_id: row.profile_id,
          has_device: row.has_device,
        });
      }
    }

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}
