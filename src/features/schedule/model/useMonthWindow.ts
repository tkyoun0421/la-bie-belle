import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  getMonthWindow,
  type MonthWindow,
} from "@/entities/schedule/dals/get-month-schedule";
import { SCHEDULE_KEY } from "@/features/schedule/model/query-keys";

/**
 * 그 달 접수 창이다 — 마감일과 확정 시각. 근무표가 아직 없으면 `null`이 와서 화면이 「안 만든
 * 달」을 그린다.
 *
 * **연 날들과 따로 읽는다.** 근무표를 만들고 아직 날을 안 열었으면 `days`가 비는데, 그 빈
 * 배열은 근무표가 아예 없는 달과 구별되지 않는다 — 화면이 「근무표를 만들고 있어요」와 「아직
 * 신청을 받지 않아요」를 갈라 말해야 한다.
 *
 * `['schedule', month]` 아래 사는 것은 근무표 행과 그 날들이 같이 낡기 때문이다 — 확정 한
 * 번에 둘 다 바뀐다.
 */

export type MonthWindowResult = {
  data: MonthWindow | null | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMonthWindow(client: Db, month: string): MonthWindowResult {
  const { data, error, isLoading } = useQuery({
    queryKey: [...SCHEDULE_KEY, month, "window"],
    queryFn: () => getMonthWindow(client, month),
  });

  return { data, error, isLoading };
}
