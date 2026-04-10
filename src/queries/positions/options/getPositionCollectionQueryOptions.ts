import { queryOptions } from "@tanstack/react-query";
import { positionQueryKeys } from "#/queries/positions/constants/positionQueryKeys";
import { fetchPositions } from "#/queries/positions/services/fetchPositions";

export function getPositionCollectionQueryOptions() {
  return queryOptions({
    queryKey: positionQueryKeys.collection(),
    queryFn: fetchPositions,
  });
}
