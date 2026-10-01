import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 기본 시급을 정한다. **따르는 사람 전원에게 같은 날 행이 한 트랜잭션에 같이 선다**
 * (`docs/2-design/modules/payroll/README.md`의 PAY-013) — 실패하면 통째로 롤백되니 일부만
 * 바뀌는 일이 없다.
 *
 * 개별로 정한 사람은 안 바뀐다. 판정은 각자의 가장 최근 행이 기준이라 화면이 명단을 보낼
 * 필요가 없다.
 */

export async function setDefaultWage(
  client: Db,
  amount: number,
): Promise<void> {
  const { error } = await client.rpc("set_default_wage", { p_amount: amount });

  if (error) {
    throw toApiError(error);
  }
}
