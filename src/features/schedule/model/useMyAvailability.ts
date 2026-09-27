import { useQuery } from "@tanstack/react-query";
import type { Db } from "@/shared/api/database";
import {
  getMonthWindow,
  type MonthWindow,
} from "@/entities/schedule/dals/get-month-schedule";
import { getMyAvailability } from "@/entities/schedule/dals/get-my-availability";
import {
  AVAILABILITY_KEY,
  SCHEDULE_KEY,
} from "@/features/schedule/model/query-keys";

/**
 * 그 달 근무 신청에 관해 화면이 묻는 것 둘이다 — 접수 창이 어떤 상태인지, 그리고 내가 무엇을
 * 냈는지. 제출 모드를 그릴지 근무표를 그릴지가 앞에서 갈리고 달력의 체크가 뒤에서 온다.
 */

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

/**
 * 그 달 접수 창이다 — 마감일과 확정 시각. 근무표가 아직 없으면 `null`이 와서 화면이 「안 만든
 * 달」을 그린다.
 *
 * `['schedule', month]` 아래 사는 것은 근무표 행과 그 날들이 같이 낡기 때문이다 — 확정 한 번에
 * 둘 다 바뀐다.
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
