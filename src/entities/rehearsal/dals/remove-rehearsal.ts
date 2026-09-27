import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 줄 하나를 지운다. 되돌리는 길이 없고 급여가 바로 따라 줄어 화면이 Dialog로 한 번
 * 확인받는다(`docs/2-design/modules/schedule/screens/rehearsal.md`의 「고치는 시트 짜임」).
 *
 * 남의 행이면 `not_allowed`다 — 관리자도 못 지운다.
 */
export async function removeRehearsal(client: Db, id: string): Promise<void> {
  const { error } = await client.rpc("remove_rehearsal", { p_id: id });

  if (error) {
    throw toApiError(error);
  }
}
