import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 관리자가 직원 이름을 고친다(`docs/2-design/modules/account/README.md`의 ACC-009).
 * 본인 손에서는 잠긴 값이라 이 문이 유일하다.
 *
 * 고치면 과거도 같이 바뀐다 — 화면이 프로필의 지금 이름 하나를 읽으므로 지난 근무표와 급여에
 * 뜨는 이름까지 따라간다. 공백만 남는 이름은 `invalid_name`이다.
 */
export async function setDisplayName(
  client: DB,
  profileId: string,
  name: string,
): Promise<void> {
  const { error } = await client.rpc("set_display_name", {
    profile_id: profileId,
    display_name: name,
  });

  if (error) {
    throw toApiError(error);
  }
}
