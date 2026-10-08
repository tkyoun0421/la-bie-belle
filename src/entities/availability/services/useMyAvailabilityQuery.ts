import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMyAvailability } from "@/entities/availability/api/getMyAvailability.api";

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
