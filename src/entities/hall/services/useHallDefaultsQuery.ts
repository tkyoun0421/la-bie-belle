import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getHallDefaults } from "@/entities/hall/api/getHallDefaults.api";
import { type HallDefaults } from "@/entities/hall/api/hall.dto";

export type HallDefaultsResult = {
  data: HallDefaults | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useHallDefaultsQuery(client: DB): HallDefaultsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.hall.all,
    queryFn: () => getHallDefaults(client),
  });

  return { data, error, isLoading };
}
