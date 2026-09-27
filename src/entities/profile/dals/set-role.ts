import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 관리자로 올리고 내린다(`docs/2-design/modules/account/README.md`의 ACC-008).
 * 관리자 전원이 같은 권한이라 누가 누구를 올리고 내리는지에 규칙이 없다.
 *
 * 마지막 관리자를 내리면 `last_admin`이다. 「마지막」의 셈에서 퇴사하거나 차단된 관리자는
 * 빠지고, 그 셈은 누르는 시점에 서버가 다시 한다.
 */
export async function setRole(
  client: Db,
  profileId: string,
  role: string,
): Promise<void> {
  const { error } = await client.rpc("set_role", {
    profile_id: profileId,
    role,
  });

  if (error) {
    throw toApiError(error);
  }
}
