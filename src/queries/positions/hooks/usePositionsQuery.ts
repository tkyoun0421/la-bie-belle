import { useQuery } from "@tanstack/react-query";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";
import { fetchPositions } from "#/queries/positions/services/fetchPositions";

export function usePositionsQuery() {
  return useQuery({
    queryKey: positionQueryKeys.collection(),
    queryFn: fetchPositions,
  });
}
