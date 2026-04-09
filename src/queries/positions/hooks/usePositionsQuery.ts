import { useQuery } from "@tanstack/react-query";
import { getPositionCollectionQueryOptions } from "#/queries/positions/options/getPositionCollectionQueryOptions";

export function usePositionsQuery() {
  return useQuery(getPositionCollectionQueryOptions());
}
