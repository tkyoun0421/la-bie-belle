import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getOpenSlots,
  type OpenSlot,
} from "@/entities/schedule/dals/getOpenSlots";

/**
 * 그 달 빈 자리다. 판정은 `open_slots` 뷰가 끝냈고 화면은 날짜별로 묶어 세기만 한다
 * (`docs/2-design/modules/schedule/design.md`의 「계산의 예외 하나」).
 *
 * 키가 `['schedule', month, 'open-slots']`인 것은 빈 자리가 그 달 근무표의 파생이라서다 —
 * 날을 열거나 확정하면 `['schedule']` 접두사 하나로 같이 낡는다.
 */

export type OpenSlotsResult = {
  data: OpenSlot[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useOpenSlots(client: DB, month: string): OpenSlotsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.schedule.openSlots(month),
    queryFn: () => getOpenSlots(client, month),
  });

  return { data, error, isLoading };
}
