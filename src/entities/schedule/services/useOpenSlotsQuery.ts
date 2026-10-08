import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getOpenSlots } from "@/entities/schedule/api/getOpenSlots.api";
import { type OpenSlot } from "@/entities/schedule/api/schedule.dto";

export type OpenSlotsResult = {
  data: OpenSlot[] | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useOpenSlotsQuery(client: DB, month: string): OpenSlotsResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.schedule.openSlots(month),
    queryFn: () => getOpenSlots(client, month),
  });

  return { data, error, isLoading };
}
