import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import { getMyAvailability } from "@/entities/schedule/dals/get-my-availability";
import { AVAILABILITY_KEY } from "@/features/schedule/model/query-keys";

/**
 * 내가 그 달에 낸 근무 신청 날짜들이다. 제출 모드로 다시 들어오면 이 값이 달력의 체크를
 * 칠한다 — 마감 전 재진입에 보낸 날짜가 선택된 채 열리는 것이 여기서 온다
 * (`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「확정 전 — 근무 신청」).
 *
 * 아직 낸 신청이 없으면 빈 배열이다. `undefined`와 갈려서 화면이 「아직 안 읽음」과 「0개를
 * 냈음」을 구별한다.
 */

export type MyAvailabilityResult = {
  data: string[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMyAvailability(
  client: Db,
  month: string,
): MyAvailabilityResult {
  const { data, error, isLoading } = useQuery({
    queryKey: [...AVAILABILITY_KEY, month],
    queryFn: () => getMyAvailability(client, month),
  });

  return { data, error, isLoading };
}
