import { useQuery } from "@tanstack/react-query";
import { positionQueryKeys } from "#/queries/positions/models/constants/positionQueryKeys";
import { fetchPositions } from "#/queries/positions/models/services/fetchPositions";

export function usePositionsQuery() {
  return useQuery({
    queryKey: positionQueryKeys.collection(),
    queryFn: fetchPositions,
  });
}
