import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMyAvailability } from "@/entities/schedule/api/getMyAvailability.api";

/**
 * 내가 그 달에 낸 근무 신청 날짜들이다. 제출 모드로 다시 들어오면 이 값이 달력의 체크를
 * 칠한다 — 마감 전 재진입에 보낸 날짜가 선택된 채 열리는 것이 여기서 온다
 * (`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「확정 전 — 근무 신청」).
 *
 * 아직 낸 신청이 없으면 빈 배열이다. `undefined`와 갈려서 화면이 「아직 안 읽음」과 「0개를
 * 냈음」을 구별한다.
 *
 * **키가 `['availability', month]`다.** 전원 신청을 읽는 `useMonthAvailabilitiesQuery`는 꼬리가
 * `'all'`인 제 키를 쓴다 — 그쪽은 행 객체를 내고 이쪽은 날짜 문자열을 내므로 키가 같으면
 * 먼저 캐시에 든 쪽이 이겨서 한쪽이 남의 모양을 읽는다
 * ([관찰 045](../../../../docs/observations/045-two-queries-share-one-cache-key.md)).
 * 어느 쪽이 꼬리를 받는지는 [design.md](../../../../docs/2-design/modules/schedule/design.md#소유-데이터)가
 * 정한다 — 리허설도 같은 꼴이다.
 */

export type MyAvailabilityResult = {
  data: string[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMyAvailabilityQuery(
  client: DB,
  month: string,
): MyAvailabilityResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.availability.mine(month),
    queryFn: () => getMyAvailability(client, month),
  });

  return { data, error, isLoading };
}
