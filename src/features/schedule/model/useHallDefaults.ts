import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  getHallDefaults,
  type HallDefaults,
} from "@/entities/schedule/dals/getHallDefaults";

/**
 * 홀의 자리·근무 시간 기본값이다. 관리자 홈의 기본값 줄과 기본값 시트가 같은 값을 본다.
 *
 * **달이 안 붙는다.** 홀 하나의 설정이라 달마다 갈리지 않고, 그래서 키도 `['hall']`
 * 하나다 — `set_hall_defaults`가 무효화하는 키와 같은 자리다.
 */

export type HallDefaultsResult = {
  data: HallDefaults | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useHallDefaults(client: DB): HallDefaultsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.hall.all,
    queryFn: () => getHallDefaults(client),
  });

  return { data, error, isLoading };
}
