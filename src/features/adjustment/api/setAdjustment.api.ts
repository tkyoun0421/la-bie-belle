import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 그날 그 사람의 근무 시간을 조정한다. **부를 때마다 새 행이다** — 덮어쓰지 않아 이력이
 * 남고 계산은 마지막 행을 쓴다(`docs/2-design/modules/payroll/design.md`의 「조정」).
 *
 * **결근이라는 말을 안 보낸다.** 그날 배정 시간만큼의 음수를 화면이 계산해 `minutes`에
 * 넣고, 「원래대로」는 `minutes = 0`인 새 행이다.
 *
 * 그날 그 사람의 살아 있는 배정이 없으면 `not_allowed`다 — 조정은 배정에 붙는다(PAY-002).
 *
 * 표의 `reason`은 비어도 되지만 이 손은 항상 사유를 받는다. 관리자가 남의 시간을 손으로
 * 고치는 자리라 왜 고쳤는지가 행과 같이 남아야 한다.
 */

export type SetAdjustmentInput = {
  dayId: string;
  profileId: string;
  minutes: number;
  reason: string;
};

export async function setAdjustment(
  client: DB,
  input: SetAdjustmentInput,
): Promise<void> {
  const { error } = await client.rpc("set_adjustment", {
    p_day_id: input.dayId,
    p_profile_id: input.profileId,
    p_minutes: input.minutes,
    p_reason: input.reason,
  });

  if (error) {
    throw toApiError(error);
  }
}
