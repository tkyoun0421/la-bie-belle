import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 개인 시급을 정한다. **적용일을 안 보낸다** — 함수가 오늘로 잡는다
 * (`docs/2-design/modules/payroll/README.md`의 PAY-008·PAY-009). 소급하는 길이 없어서
 * 화면에도 날짜 칸이 없다.
 *
 * 같은 날 두 번 부르면 행이 하나고 값은 나중 것이다(PAY-011).
 */

export type SetWageInput = {
  profileId: string;
  amount: number;
};

export async function setWage(client: DB, input: SetWageInput): Promise<void> {
  const { error } = await client.rpc("set_wage", {
    p_profile_id: input.profileId,
    p_amount: input.amount,
  });

  if (error) {
    throw toApiError(error);
  }
}
