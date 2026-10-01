import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 임시공휴일을 켜고 끈다 — 손으로 넣는 쪽이라 받아온 행과 다른 `source`로 선다
 * (`docs/2-design/modules/payroll/design.md`의 「공휴일」).
 *
 * 같은 날짜에 이미 받아온 행이 있으면 아무것도 안 한다. 이미 공휴일이라 켤 것도 끌 것도
 * 없다 — 화면은 그 줄을 잠근 채 보여준다.
 */

export type SetHolidayInput = {
  date: string;
  on: boolean;
};

export async function setHoliday(
  client: Db,
  input: SetHolidayInput,
): Promise<void> {
  const { error } = await client.rpc("set_holiday", {
    p_date: input.date,
    p_on: input.on,
  });

  if (error) {
    throw toApiError(error);
  }
}
