import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 개인 시급을 기본값으로 되돌린다. 오늘부터 다시 끈에 붙어서, 그 뒤 기본 시급이 바뀌면 이
 * 사람도 같이 따라간다(`docs/2-design/modules/payroll/README.md`의 PAY-014).
 *
 * 지난 행은 그대로 남는다 — 되돌리는 것은 오늘부터지 지난 급여가 아니다.
 */

export async function resetWageToDefault(
  client: Db,
  profileId: string,
): Promise<void> {
  const { error } = await client.rpc("reset_wage_to_default", {
    p_profile_id: profileId,
  });

  if (error) {
    throw toApiError(error);
  }
}
